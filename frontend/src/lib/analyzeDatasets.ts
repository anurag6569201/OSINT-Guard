import type {
  InstagramProfile,
  LinkedInPost,
  LinkedInPosition,
  LinkedInProfileRecord,
  TwitterTweet,
} from '../types/datasets'

export type MapMarker = {
  id: string
  label: string
  lat: number
  lng: number
  source: string
  detail: string
}

/** Approximate coords for OSINT-style location correlation (manual geocode for demo). */
const PLACE_COORDS: { match: (s: string) => boolean; lat: number; lng: number }[] = [
  { match: (s) => /vizag|visakhapatnam/i.test(s), lat: 17.6868, lng: 83.2185 },
  { match: (s) => /\bbbsr\b|bhubaneswar|iiit.*bbs/i.test(s), lat: 20.2961, lng: 85.8245 },
  { match: (s) => /maihar/i.test(s), lat: 24.2647, lng: 80.7513 },
  { match: (s) => /kota/i.test(s), lat: 25.2138, lng: 75.8648 },
  { match: (s) => /san francisco/i.test(s), lat: 37.7749, lng: -122.4194 },
  { match: (s) => /\bdelhi\b/i.test(s), lat: 28.6139, lng: 77.209 },
  { match: (s) => /surat/i.test(s), lat: 21.1702, lng: 72.8311 },
  { match: (s) => /gandhinagar/i.test(s), lat: 23.2156, lng: 72.6369 },
  { match: (s) => /odisha|bhuban/i.test(s), lat: 20.2961, lng: 85.8245 },
]

function coordsForLabel(label: string): { lat: number; lng: number } | null {
  const s = label.trim()
  for (const p of PLACE_COORDS) {
    if (p.match(s)) return { lat: p.lat, lng: p.lng }
  }
  return null
}

function dedupeTweets(tweets: TwitterTweet[]): TwitterTweet[] {
  const seen = new Set<string>()
  const out: TwitterTweet[] = []
  for (const t of tweets) {
    if (seen.has(t.url)) continue
    seen.add(t.url)
    out.push(t)
  }
  return out
}

export function linkedinFullName(p: LinkedInProfileRecord | undefined): string | null {
  if (!p) return null
  const a = (p.firstName ?? '').trim()
  const b = (p.lastName ?? '').trim()
  const n = `${a} ${b}`.trim()
  return n || null
}

/** Posts authored by the profile subject (excludes pure reshares of others). */
export function filterAuthoredLinkedInPosts(
  posts: LinkedInPost[],
  profile: LinkedInProfileRecord | undefined,
): LinkedInPost[] {
  const id = profile?.publicIdentifier
  if (!id) return posts
  return posts.filter(
    (p) =>
      p.authorProfileId === id ||
      p.author?.publicId === id ||
      (p.authorProfileUrl && p.authorProfileUrl.includes(`/in/${id}`)),
  )
}

export function buildMapMarkers(
  ig: InstagramProfile[],
  li: LinkedInProfileRecord[],
): MapMarker[] {
  const markers: MapMarker[] = []
  let n = 0
  const add = (label: string, source: string, detail: string) => {
    const c = coordsForLabel(label)
    if (!c) return
    const id = `${source}-${n++}-${label.slice(0, 24)}`
    markers.push({ id, label, ...c, source, detail })
  }

  const profile = ig[0]
  if (profile) {
    for (const p of profile.latestPosts ?? []) {
      const name = p.locationName ?? p.location?.name
      if (name) add(name, 'Instagram', p.caption?.slice(0, 80) ?? p.shortCode)
    }
  }

  const linked = li[0]
  if (linked?.locationName) {
    add(linked.locationName, 'LinkedIn profile', 'Declared location')
  }
  for (const ex of linked?.positions ?? []) {
    if (ex.locationName) add(ex.locationName, 'LinkedIn role', `${ex.title ?? 'Role'} · ${ex.companyName ?? ''}`)
  }
  if (linked?.educations?.length) {
    const ed = linked.educations[0]
    if (ed?.schoolName) add(ed.schoolName, 'LinkedIn education', ed.degreeName ?? 'Education')
  }

  const uniq = new Map<string, MapMarker>()
  for (const m of markers) {
    const key = `${m.lat.toFixed(3)},${m.lng.toFixed(3)}`
    if (!uniq.has(key)) uniq.set(key, m)
  }
  return [...uniq.values()]
}

export type TwitterMonthRow = { month: string; tweets: number; views: number }

export function twitterActivityByMonth(tweets: TwitterTweet[]): TwitterMonthRow[] {
  const clean = dedupeTweets(tweets)
  const buckets = new Map<string, { tweets: number; views: number }>()
  for (const t of clean) {
    const d = new Date(t.createdAt)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = buckets.get(key) ?? { tweets: 0, views: 0 }
    cur.tweets += 1
    cur.views += t.viewCount ?? 0
    buckets.set(key, cur)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      tweets: v.tweets,
      views: v.views,
    }))
}

export type MediaTypeRow = { name: string; value: number }

export function instagramMediaMix(profile: InstagramProfile | undefined): MediaTypeRow[] {
  if (!profile?.latestPosts?.length) return []
  const counts = new Map<string, number>()
  for (const p of profile.latestPosts) {
    const key = p.is_video ? 'Video' : p.mediaType.replace(/^Graph/, '') || 'Post'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }))
}

export type SkillRow = { skill: string; weight: number }

export function linkedinTopSkills(profile: LinkedInProfileRecord | undefined, limit = 12): SkillRow[] {
  const skills = profile?.skills ?? []
  const names = skills
    .map((s) => s.skillName?.trim())
    .filter((s): s is string => Boolean(s))
  return names.slice(0, limit).map((skill, i) => ({
    skill,
    weight: limit - i,
  }))
}

export type LinkedInMonthRow = { month: string; posts: number; reactions: number; comments: number }

export function linkedinActivityByMonth(posts: LinkedInPost[]): LinkedInMonthRow[] {
  const buckets = new Map<string, { posts: number; reactions: number; comments: number }>()
  for (const p of posts) {
    const raw = p.postedAtISO
    if (!raw) continue
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = buckets.get(key) ?? { posts: 0, reactions: 0, comments: 0 }
    cur.posts += 1
    const rc = p.reactions?.length ?? 0
    cur.reactions += rc > 0 ? rc : p.numLikes ?? 0
    cur.comments += p.numComments ?? p.comments?.length ?? 0
    buckets.set(key, cur)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }))
}

export type ReactionMixRow = { name: string; value: number }

export function linkedinReactionMix(posts: LinkedInPost[]): ReactionMixRow[] {
  const counts = new Map<string, number>()
  for (const p of posts) {
    for (const r of p.reactions ?? []) {
      const t = r.type ?? 'UNKNOWN'
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }))
}

export type HashtagRow = { tag: string; count: number }

export function linkedinTopHashtags(posts: LinkedInPost[], limit = 14): HashtagRow[] {
  const counts = new Map<string, number>()
  const re = /#([\p{L}\p{N}_]+)/gu
  for (const p of posts) {
    const text = p.text ?? ''
    let m: RegExpExecArray | null
    const seenInPost = new Set<string>()
    while ((m = re.exec(text)) !== null) {
      const tag = m[1].toLowerCase()
      if (seenInPost.has(tag)) continue
      seenInPost.add(tag)
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}

export type LinkedInEngagementTotals = {
  posts: number
  reactionRecords: number
  comments: number
  shares: number
  uniqueReactors: number
}

export function linkedinEngagementTotals(posts: LinkedInPost[]): LinkedInEngagementTotals {
  const reactors = new Set<string>()
  let reactionRecords = 0
  let comments = 0
  let shares = 0
  for (const p of posts) {
    for (const r of p.reactions ?? []) {
      reactionRecords += 1
      const id = r.profile?.profileId ?? r.profile?.publicId
      if (id) reactors.add(id)
    }
    comments += p.numComments ?? p.comments?.length ?? 0
    shares += p.numShares ?? 0
  }
  return {
    posts: posts.length,
    reactionRecords,
    comments,
    shares,
    uniqueReactors: reactors.size,
  }
}

export type CareerRow = {
  title: string
  company: string
  location: string
  range: string
  current: boolean
}

function monthYear(m?: number, y?: number): string {
  if (y == null) return '—'
  if (m == null || m < 1) return String(y)
  return `${String(m).padStart(2, '0')}/${y}`
}

export function linkedinCareerRows(profile: LinkedInProfileRecord | undefined): CareerRow[] {
  const positions = profile?.positions ?? []
  return positions.map((x: LinkedInPosition) => {
    const start = monthYear(x.startMonth, x.startYear)
    const end = x.current ? 'Present' : monthYear(x.endMonth, x.endYear)
    const parts: string[] = []
    if (x.durationYear) parts.push(`${x.durationYear} yr`)
    if (x.durationMonth) parts.push(`${x.durationMonth} mo`)
    const dur = parts.length ? ` (${parts.join(' ')})` : ''
    return {
      title: x.title ?? 'Role',
      company: x.companyName ?? '—',
      location: x.locationName ?? '',
      range: `${start} – ${end}${dur}`,
      current: Boolean(x.current),
    }
  })
}

export type CrossPlatformStat = {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'accent' | 'warn'
}

export function crossPlatformStats(
  ig: InstagramProfile[],
  tw: TwitterTweet[],
  li: LinkedInProfileRecord[],
  liPosts: LinkedInPost[],
): CrossPlatformStat[] {
  const igP = ig[0]
  const liP = li[0]
  const twN = dedupeTweets(tw).length
  const authored = filterAuthoredLinkedInPosts(liPosts, liP)
  const eng = linkedinEngagementTotals(authored)

  const handles = new Set<string>()
  if (igP?.username) handles.add(`@${igP.username}`)
  const twUser = dedupeTweets(tw)[0]?.['author.userName']
  if (twUser) handles.add(`@${twUser}`)
  if (liP?.publicIdentifier) handles.add(`in/${liP.publicIdentifier}`)

  const externalDomains = new Set<string>()
  for (const u of igP?.externalUrls ?? []) {
    try {
      externalDomains.add(new URL(u.url).hostname.replace(/^www\./, ''))
    } catch {
      /* ignore */
    }
  }

  const skillN = liP?.skills?.filter((s) => s.skillName?.trim()).length ?? 0

  return [
    {
      label: 'Indexed handles',
      value: String(handles.size),
      hint: [...handles].join(' · '),
      tone: 'accent',
    },
    {
      label: 'Public tweets (sample)',
      value: String(twN),
      hint: 'Engagement + timestamps visible to scrapers',
    },
    {
      label: 'LinkedIn authored posts',
      value: String(authored.length),
      hint: 'Feed export: text, reactors, and comment threads',
      tone: 'accent',
    },
    {
      label: 'LinkedIn skill nodes',
      value: String(skillN),
      hint: 'Stack signals for targeted recruiter lures',
    },
    {
      label: 'Reaction graph (unique)',
      value: eng.uniqueReactors > 0 ? String(eng.uniqueReactors) : '—',
      hint:
        eng.uniqueReactors > 0
          ? 'Distinct profiles surfaced via likes — secondary targeting surface'
          : 'No reactor list in sample',
      tone: eng.uniqueReactors > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Link-out surface (IG)',
      value: String(igP?.externalUrls?.length ?? 0),
      hint:
        externalDomains.size > 0
          ? [...externalDomains].slice(0, 4).join(', ')
          : 'Bio links expand attack surface',
      tone: 'warn',
    },
    {
      label: 'Geo-tagged posts',
      value: String(
        igP?.latestPosts?.filter((p) => p.locationName || p.location?.name).length ?? 0,
      ),
      hint: 'Location names anchor physical pattern of life',
      tone: 'warn',
    },
  ]
}

export function resolvedTargetName(
  ig: InstagramProfile[],
  li: LinkedInProfileRecord[],
): string | null {
  return linkedinFullName(li[0]) ?? ig[0]?.fullName ?? null
}

/** First LinkedIn banner URL: author background on a recent post, else none. */
export function linkedinBannerFromPosts(posts: LinkedInPost[]): string | null {
  for (const p of posts) {
    const bg = p.author?.backgroundImage
    if (bg) return bg
  }
  return null
}
