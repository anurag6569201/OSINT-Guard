/**
 * Security / privacy oriented analytics on top of collected datasets.
 */

import type {
  InstagramPost,
  InstagramProfile,
  LinkedInPost,
  LinkedInProfileRecord,
  TwitterTweet,
} from '../types/datasets'
import { dedupeTweets, filterAuthoredLinkedInPosts, linkedinFullName } from './analyzeDatasets'
import type { CollectErrorKey } from '../context/datasetContextState'
import type { LoadedDatasets } from './loadDatasets'

const STOPWORDS = new Set(
  `the and for that this with you are from have was were been their what when your will can not but has had all any our out who how its also just more than into about would could some them then there these very much every other only get like one two new now may way use see come did does because including through over such https http com www linkedin instagram twitter x ig fb
  from via amp ltd inc llc org net co in at my me we he she it as an on if or so no of to in is be am by do go up re ei`.split(/\s+/),
)

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s#]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

function countTokens(texts: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of texts) {
    const seen = new Set<string>()
    for (const w of tokenize(t)) {
      if (seen.has(w)) continue
      seen.add(w)
      m.set(w, (m.get(w) ?? 0) + 1)
    }
  }
  return m
}

export type TopicOverlapResult = {
  linkedin: { word: string; count: number }[]
  twitter: { word: string; count: number }[]
  instagram: { word: string; count: number }[]
  /** Terms appearing in 2+ channels (strong pretext signal). */
  crossChannel: { word: string; channels: string }[]
}

export function computeTopicOverlap(
  ig: InstagramProfile[],
  tw: TwitterTweet[],
  li: LinkedInProfileRecord[],
  liPosts: LinkedInPost[],
  limit = 12,
): TopicOverlapResult {
  const liP = li[0]
  const authored = filterAuthoredLinkedInPosts(liPosts, liP)
  const liTexts = authored.map((p) => p.text ?? '').filter(Boolean)
  const twTexts = dedupeTweets(tw).map((t) => t.text ?? '')
  const igTexts = (ig[0]?.latestPosts ?? []).map((p) => p.caption ?? '').filter(Boolean)

  const mLi = countTokens(liTexts)
  const mTw = countTokens(twTexts)
  const mIg = countTokens(igTexts)

  const sortTop = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }))

  const allKeys = new Set<string>([...mLi.keys(), ...mTw.keys(), ...mIg.keys()])
  const crossChannel: { word: string; channels: string }[] = []
  for (const w of allKeys) {
    const ch: string[] = []
    if ((mLi.get(w) ?? 0) > 0) ch.push('LinkedIn')
    if ((mTw.get(w) ?? 0) > 0) ch.push('X')
    if ((mIg.get(w) ?? 0) > 0) ch.push('Instagram')
    if (ch.length >= 2) {
      crossChannel.push({ word: w, channels: ch.join(' · ') })
    }
  }
  crossChannel.sort((a, b) => b.channels.length - a.channels.length || a.word.localeCompare(b.word))

  return {
    linkedin: sortTop(mLi),
    twitter: sortTop(mTw),
    instagram: sortTop(mIg),
    crossChannel: crossChannel.slice(0, limit),
  }
}

export type PostingHourRow = { hour: number; label: string; count: number }

export function postingActivityByHourUTC(
  twitter: TwitterTweet[],
  liPosts: LinkedInPost[],
  igPosts: InstagramPost[],
): PostingHourRow[] {
  const buckets = new Array(24).fill(0)
  const bump = (raw: string | number | undefined) => {
    if (raw == null) return
    const d = typeof raw === 'number' ? new Date(raw > 1e12 ? raw : raw * 1000) : new Date(raw)
    if (Number.isNaN(d.getTime())) return
    buckets[d.getUTCHours()] += 1
  }
  for (const t of dedupeTweets(twitter)) {
    bump(t.createdAt)
  }
  for (const p of liPosts) {
    if (p.postedAtISO) bump(p.postedAtISO)
    else bump(p.postedAtTimestamp)
  }
  for (const p of igPosts) {
    bump(p.timestamp)
  }
  return buckets.map((count, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    count,
  }))
}

export type ReactorConcentration = {
  totalReactions: number
  uniqueReactorsApprox: number
  topReactors: { label: string; count: number }[]
  top5SharePct: number | null
}

export function linkedinReactorConcentration(posts: LinkedInPost[]): ReactorConcentration {
  const counts = new Map<string, number>()
  const idSet = new Set<string>()
  let total = 0
  for (const p of posts) {
    for (const r of p.reactions ?? []) {
      total += 1
      const prof = r.profile
      const id = prof?.profileId || prof?.publicId || ''
      if (id) idSet.add(id)
      const label = (
        prof?.publicId ||
        prof?.profileId ||
        [prof?.firstName, prof?.lastName].filter(Boolean).join(' ') ||
        'Unknown'
      ).trim()
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }
  const topReactors = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => ({ label, count }))
  const top5sum = topReactors.slice(0, 5).reduce((s, x) => s + x.count, 0)
  return {
    totalReactions: total,
    uniqueReactorsApprox: idSet.size > 0 ? idSet.size : counts.size,
    topReactors,
    top5SharePct: total > 0 ? Math.round((100 * top5sum) / total) : null,
  }
}

const URL_RE = /https?:\/\/[^\s)<]+/gi

export type LinkSurfaceItem = { url: string; host: string; source: string; snippet: string }

export function extractLinkSurface(
  ig: InstagramProfile[],
  liPosts: LinkedInPost[],
  tw: TwitterTweet[],
): LinkSurfaceItem[] {
  const out: LinkSurfaceItem[] = []
  const seen = new Set<string>()

  const push = (url: string, source: string, snippet: string) => {
    const u = url.replace(/[.,;!?]+$/, '')
    if (seen.has(`${u}|${source}`)) return
    seen.add(`${u}|${source}`)
    let host = ''
    try {
      host = new URL(u).hostname.replace(/^www\./, '')
    } catch {
      host = u
    }
    out.push({ url: u, host, source, snippet: snippet.slice(0, 120) })
  }

  for (const e of ig[0]?.externalUrls ?? []) {
    if (e.url) push(e.url, 'Instagram bio', e.title ?? e.url)
  }
  for (const t of dedupeTweets(tw)) {
    const text = t.text ?? ''
    let m: RegExpExecArray | null
    const re = new RegExp(URL_RE.source, URL_RE.flags)
    while ((m = re.exec(text)) !== null) {
      push(m[0], 'X post', text)
    }
  }
  for (const p of liPosts) {
    const text = p.text ?? ''
    let m: RegExpExecArray | null
    const re = new RegExp(URL_RE.source, URL_RE.flags)
    while ((m = re.exec(text)) !== null) {
      push(m[0], 'LinkedIn post', text)
    }
  }
  return out.slice(0, 40)
}

export type IdentityLinkage = {
  primaryName: string | null
  nameAlignment: 'aligned' | 'partial' | 'unknown' | 'mismatch'
  note: string
  crossPlatformUrls: { hint: string; url: string }[]
}

function detectUrlPlatform(host: string): string | null {
  const h = host.toLowerCase()
  if (h.includes('linkedin.com')) return 'LinkedIn'
  if (h.includes('twitter.com') || h.includes('x.com')) return 'X'
  if (h.includes('instagram.com')) return 'Instagram'
  if (h.includes('github.com')) return 'GitHub'
  if (h.includes('t.me') || h.includes('telegram')) return 'Telegram'
  return null
}

export function computeIdentityLinkage(
  ig: InstagramProfile[],
  tw: TwitterTweet[],
  li: LinkedInProfileRecord[],
): IdentityLinkage {
  const liName = linkedinFullName(li[0])
  const igName = ig[0]?.fullName?.trim() ?? null
  const twName = dedupeTweets(tw)[0]?.['author.name']?.trim() ?? null

  let nameAlignment: IdentityLinkage['nameAlignment'] = 'unknown'
  let note = 'Not enough names to compare across platforms.'
  if (liName && igName) {
    const a = liName.toLowerCase()
    const b = igName.toLowerCase()
    if (a === b) {
      nameAlignment = 'aligned'
      note = 'LinkedIn and Instagram display names match — strong identity link.'
    } else if (a.includes(b.split(/\s+/)[0] ?? '') || b.includes(a.split(/\s+/)[0] ?? '')) {
      nameAlignment = 'partial'
      note = 'Names partially overlap — review manually for same person.'
    } else {
      nameAlignment = 'mismatch'
      note = 'Display names differ — may be different branding or incomplete scrape.'
    }
  } else if (liName && twName) {
    const a = liName.toLowerCase()
    const b = twName.toLowerCase()
    nameAlignment = a === b ? 'aligned' : a.split(/\s+/)[0] === b.split(/\s+/)[0] ? 'partial' : 'mismatch'
    note =
      nameAlignment === 'aligned'
        ? 'LinkedIn and X author names match.'
        : 'Compare LinkedIn vs X names for linkage confidence.'
  }

  const crossPlatformUrls: { hint: string; url: string }[] = []
  const seen = new Set<string>()
  for (const e of ig[0]?.externalUrls ?? []) {
    if (!e.url) continue
    let host = ''
    try {
      host = new URL(e.url.startsWith('http') ? e.url : `https://${e.url}`).hostname
    } catch {
      continue
    }
    const plat = detectUrlPlatform(host)
    if (plat && !seen.has(e.url)) {
      seen.add(e.url)
      crossPlatformUrls.push({ hint: `${plat} from Instagram bio`, url: e.url })
    }
  }

  const primaryName = liName ?? igName ?? twName

  return { primaryName, nameAlignment, note, crossPlatformUrls }
}

export type PiiSignals = {
  emailHits: number
  phoneHits: number
  dmInviteMentions: number
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const PHONE_RE = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g
const DM_RE = /\b(dm me|direct message|message me|whatsapp)\b/gi

export function scanPiiSignals(
  ig: InstagramProfile[],
  liPosts: LinkedInPost[],
  tw: TwitterTweet[],
): PiiSignals {
  const corpus: string[] = []
  if (ig[0]?.biography) corpus.push(ig[0].biography)
  for (const p of ig[0]?.latestPosts ?? []) {
    if (p.caption) corpus.push(p.caption)
  }
  for (const t of dedupeTweets(tw)) {
    if (t.text) corpus.push(t.text)
  }
  for (const p of liPosts) {
    if (p.text) corpus.push(p.text)
  }
  const blob = corpus.join('\n')
  const emails = blob.match(EMAIL_RE) ?? []
  const phones = blob.match(PHONE_RE) ?? []
  const dms = blob.match(DM_RE) ?? []
  return {
    emailHits: emails.length,
    phoneHits: Math.min(phones.length, 50),
    dmInviteMentions: dms.length,
  }
}

export type ExposureRubric = {
  score: number
  factors: { label: string; points: number; detail: string }[]
}

export function computeExposureRubric(
  ig: InstagramProfile[],
  tw: TwitterTweet[],
  li: LinkedInProfileRecord[],
  liPosts: LinkedInPost[],
  topicOverlap: TopicOverlapResult,
  pii: PiiSignals,
  linkSurfaceCount: number,
): ExposureRubric {
  const factors: ExposureRubric['factors'] = []
  const add = (label: string, points: number, detail: string) => {
    if (points > 0) factors.push({ label, points, detail })
  }

  const liP = li[0]
  const authored = filterAuthoredLinkedInPosts(liPosts, liP)
  const twN = dedupeTweets(tw).length
  const platCount = [ig[0], liP, twN > 0 ? tw : null].filter(Boolean).length

  let s = 0
  if (platCount >= 3) {
    add('Multi-platform corpus', 12, `${platCount} surfaces with data`)
    s += 12
  } else if (platCount === 2) {
    add('Dual-platform', 6, 'Two platforms with data')
    s += 6
  }

  const geoN =
    ig[0]?.latestPosts?.filter((p) => p.locationName || p.location?.name).length ?? 0
  if (geoN > 0) {
    add('Geo-tagged content', 10, `${geoN} Instagram posts with location`)
    s += 10
  }

  const extN = ig[0]?.externalUrls?.length ?? 0
  if (extN > 0) {
    add('Bio link-outs', 8, `${extN} outbound links in Instagram bio`)
    s += 8
  }

  if (linkSurfaceCount > 0) {
    add('URLs in posts', Math.min(12, 4 + linkSurfaceCount), `${linkSurfaceCount} URLs in captions/posts`)
    s += Math.min(12, 4 + linkSurfaceCount)
  }

  const rc = linkedinReactorConcentration(authored)
  if (rc.uniqueReactorsApprox >= 15) {
    add('Large reactor graph', 12, `${rc.uniqueReactorsApprox} unique reactors (by id) — secondary targeting`)
    s += 12
  } else if (rc.uniqueReactorsApprox >= 5) {
    add('Moderate reactor graph', 6, `${rc.uniqueReactorsApprox} unique reactors`)
    s += 6
  }

  if (twN >= 15) {
    add('High tweet volume', 8, `${twN} tweets in sample`)
    s += 8
  } else if (twN >= 5) {
    add('Tweet sample', 4, `${twN} tweets`)
    s += 4
  }

  if (authored.length >= 5) {
    add('LinkedIn activity depth', 8, `${authored.length} authored posts`)
    s += 8
  } else if (authored.length >= 1) {
    add('LinkedIn presence', 4, `${authored.length} authored posts`)
    s += 4
  }

  if (topicOverlap.crossChannel.length >= 5) {
    add('Repeated themes', 10, `${topicOverlap.crossChannel.length} terms across 2+ platforms`)
    s += 10
  } else if (topicOverlap.crossChannel.length >= 2) {
    add('Cross-platform keywords', 5, `${topicOverlap.crossChannel.length} overlapping terms`)
    s += 5
  }

  if (pii.emailHits > 0) {
    add('Email-like patterns in text', 14, `${pii.emailHits} matches — verify; high phishing value`)
    s += 14
  }
  if (pii.phoneHits > 0) {
    add('Phone-like patterns', 10, `${pii.phoneHits} matches — may be false positives`)
    s += 10
  }
  if (pii.dmInviteMentions > 0) {
    add('DM / contact invitations', 6, `${pii.dmInviteMentions} mentions`)
    s += 6
  }

  const score = Math.min(100, s)
  return { score, factors }
}

/** Actionable “remove / tighten” guidance derived from the same signals as the rubric. */
export type RemediationItem = {
  id: string
  priority: 'critical' | 'high' | 'standard'
  title: string
  /** Why taking this offline makes attacks (phishing, takeover, impersonation) harder. */
  howRemovingHelps: string
  actions: string[]
}

const REMEDIATION_PRIO: Record<RemediationItem['priority'], number> = {
  critical: 0,
  high: 1,
  standard: 2,
}

/**
 * Maps detected footprint signals to concrete steps: what you can remove or tighten
 * to make phishing, impersonation, and account takeover harder.
 * Does not call external models — safe to show whenever analytics run.
 */
export function buildRemediationChecklist(
  ig: InstagramProfile[],
  tw: TwitterTweet[],
  li: LinkedInProfileRecord[],
  liPosts: LinkedInPost[],
  pii: PiiSignals,
  topicOverlap: TopicOverlapResult,
  linkSurface: LinkSurfaceItem[],
  identityLinkage: IdentityLinkage,
): RemediationItem[] {
  const items: RemediationItem[] = []
  const liP = li[0]
  const authored = filterAuthoredLinkedInPosts(liPosts, liP)
  const twN = dedupeTweets(tw).length
  const platCount = [ig[0], liP, twN > 0 ? tw : null].filter(Boolean).length
  const geoN =
    ig[0]?.latestPosts?.filter((p) => p.locationName || p.location?.name).length ?? 0
  const extN = ig[0]?.externalUrls?.length ?? 0

  if (pii.emailHits > 0) {
    items.push({
      id: 'remove-public-email',
      priority: 'critical',
      title: 'Remove or hide public email addresses',
      howRemovingHelps:
        'Taking your email off the public web makes targeted phishing, password-reset tricks, and credential-stuffing against that address much harder to pull off.',
      actions: [
        'Delete emails from bios, captions, Linktree-style pages, and image or video text.',
        'Use a forwarding alias or the platform’s contact button if you still need inbound mail.',
      ],
    })
  }

  if (pii.phoneHits > 0) {
    items.push({
      id: 'remove-public-phone',
      priority: 'high',
      title: 'Remove phone numbers from public posts and bios',
      howRemovingHelps:
        'Without a public number, attackers lose an easy path to SIM-swap scams, fake “missed call” texts, and matching you across leaked databases.',
      actions: [
        'Redact numbers from posts and profile fields; avoid “text me” workflows on public grids.',
        'If a number must be public, use a VoIP or business line not tied to your main SIM.',
      ],
    })
  }

  if (pii.dmInviteMentions > 0) {
    items.push({
      id: 'reduce-dm-cta',
      priority: 'high',
      title: 'Soften “DM me” / WhatsApp-style call-to-actions',
      howRemovingHelps:
        'Closing open “DM me” and chat-app invites blocks a common first step: strangers sliding in with malware links, fake jobs, or impersonation.',
      actions: [
        'Replace open-ended “DM me” lines with bounded options (e.g. email form, booking link with rate limits).',
        'Remove WhatsApp/Telegram links from public bios unless you truly need them visible.',
      ],
    })
  }

  if (geoN > 0) {
    items.push({
      id: 'strip-geo-tags',
      priority: 'high',
      title: 'Strip routine location tags from posts',
      howRemovingHelps:
        'Removing location crumbs stops people from inferring where you live, work, and travel — so physical stalking, “we’re nearby” scams, and timing attacks get weaker.',
      actions: [
        `Remove location stickers or check-ins from ${geoN} sampled post(s); keep them only when intentional.`,
        'Default new posts to no location; review older highlights and reels metadata.',
      ],
    })
  }

  if (extN > 0) {
    items.push({
      id: 'audit-bio-links',
      priority: 'high',
      title: 'Audit outbound links in your Instagram (or similar) bio',
      howRemovingHelps:
        'Fewer bio links means fewer hops to your other accounts, calendars, and personal sites — so automated scrapers and phishers have less to chain together.',
      actions: [
        `Review each of the ${extN} bio link(s): remove dead tools, duplicate profiles, and tracking-heavy short links.`,
        'Prefer one minimal landing page over many parallel entry points.',
      ],
    })
  }

  if (linkSurface.length > 0) {
    items.push({
      id: 'audit-post-urls',
      priority: 'standard',
      title: 'Review URLs embedded in posts',
      howRemovingHelps:
        'Deleting or archiving posts with sensitive links shrinks the map of your tools, employers, and side projects — so tailored fake login pages and pretexts are harder to build.',
      actions: [
        `Scan ${linkSurface.length} surfaced URL(s); delete or archive posts that point at personal infra.`,
        'Avoid posting signed or single-use links (docs, calendars) where they stay public indefinitely.',
      ],
    })
  }

  if (identityLinkage.crossPlatformUrls.length > 0) {
    items.push({
      id: 'break-cross-links',
      priority: 'high',
      title: 'Break obvious cross-profile links if you want separation',
      howRemovingHelps:
        'Unlinking profiles in bios slows attackers down: they can’t automatically treat every account as the same person, which weakens cross-platform impersonation and targeting.',
      actions: [
        'Remove “find me on X/LinkedIn” style links from bios if those accounts should not be joinable.',
        'Use different display names or handles where branding allows, so automated matching is harder.',
      ],
    })
  }

  if (topicOverlap.crossChannel.length >= 5) {
    items.push({
      id: 'diversify-public-themes',
      priority: 'standard',
      title: 'Reduce repeated life-detail themes across every public bio',
      howRemovingHelps:
        'Saying less of the same story everywhere makes it harder for someone to fake a believable email or DM that “knows” your hobbies, job, and plans.',
      actions: [
        'Keep LinkedIn professional; trim overlapping personal detail from X/Instagram bios.',
        'Avoid announcing travel, vendor stacks, and internal codenames in multiple channels at once.',
      ],
    })
  } else if (topicOverlap.crossChannel.length >= 2) {
    items.push({
      id: 'trim-cross-channel-overlap',
      priority: 'standard',
      title: 'Trim overlapping keywords between platforms',
      howRemovingHelps:
        'Trimming duplicate details across bios denies attackers cheap material for spear-phishing: they have fewer true facts to sound trustworthy.',
      actions: [
        'Pick one channel for niche hobbies or side projects; keep others higher-level.',
        'Remove redundant employer + role strings where they echo across bios and pinned posts.',
      ],
    })
  }

  if (platCount >= 3) {
    items.push({
      id: 'compartmentalize-personas',
      priority: 'standard',
      title: 'Compartmentalize if you use three or more public surfaces',
      howRemovingHelps:
        'Archiving or locking extra public profiles removes whole extra channels attackers can scrape — fewer angles for scams and impersonation.',
      actions: [
        'Decide which account is “public professional” vs private; lock or archive the rest.',
        'Remove inactive public accounts that still index old posts and photos.',
      ],
    })
  }

  if (authored.length >= 8) {
    items.push({
      id: 'linkedin-activity-archive',
      priority: 'standard',
      title: 'Archive dated LinkedIn commentary',
      howRemovingHelps:
        'Removing or unpinning posts that name projects, clients, and colleagues leaves attackers with less fodder for fake “internal” messages and recruiter scams.',
      actions: [
        'Unpin or delete posts that name internal tools, clients, or conflicts.',
        'Reduce reaction/comment visibility where the platform allows — it maps your network graph.',
      ],
    })
  }

  items.push(
    {
      id: 'audience-defaults',
      priority: 'standard',
      title: 'Tighten default audience and discovery settings',
      howRemovingHelps:
        'Not everyone needs to see every post: tighter defaults and less “find friends” exposure mean strangers can’t quietly build a full picture to attack you with.',
      actions: [
        'Set new posts to followers-only or close friends where that fits your goals.',
        'Disable “suggest account from contacts” and similar if you are hardening a persona.',
      ],
    },
    {
      id: 'account-security',
      priority: 'standard',
      title: 'Strengthen login and app access',
      howRemovingHelps:
        'Even if someone learns about you from social media, strong 2FA and fewer old app logins help prevent them from actually hijacking the account.',
      actions: [
        'Enable phishing-resistant 2FA (security keys or passkeys) on every social account you keep.',
        'Revoke unused third-party apps and review active sessions periodically.',
      ],
    },
  )

  items.sort(
    (a, b) =>
      REMEDIATION_PRIO[a.priority] - REMEDIATION_PRIO[b.priority] ||
      a.title.localeCompare(b.title),
  )

  return items
}

export type DataQualityLine = { label: string; value: string; warn?: boolean }

export function buildDataQualityStrip(
  data: LoadedDatasets,
  dataSource: 'dummy' | 'live',
  collectErrors: Partial<Record<CollectErrorKey, string>> | null,
): DataQualityLine[] {
  const rows: DataQualityLine[] = []
  rows.push({
    label: 'Corpus',
    value: dataSource === 'dummy' ? 'Bundled sandbox JSON' : 'Live Apify + optional DB restore',
  })
  const igN = data.instagram?.length ?? 0
  const twN = data.twitter?.length ?? 0
  const liPN = data.linkedinProfile?.length ?? 0
  const liPostsN = data.linkedinPosts?.length ?? 0
  rows.push({
    label: 'Row counts',
    value: `IG profiles ${igN} · X tweets ${twN} · LI profiles ${liPN} · LI posts ${liPostsN}`,
    warn: igN + twN + liPN + liPostsN === 0,
  })
  if (collectErrors && Object.keys(collectErrors).length > 0) {
    for (const [k, msg] of Object.entries(collectErrors)) {
      rows.push({
        label: `Source · ${k}`,
        value: String(msg).slice(0, 200) + (String(msg).length > 200 ? '…' : ''),
        warn: true,
      })
    }
  }
  return rows
}
