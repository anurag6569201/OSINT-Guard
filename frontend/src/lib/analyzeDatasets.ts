import type {
  InstagramProfile,
  LinkedInProfile,
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

export function buildMapMarkers(
  ig: InstagramProfile[],
  li: LinkedInProfile[],
): MapMarker[] {
  const markers: MapMarker[] = []
  let n = 0
  const add = (
    label: string,
    source: string,
    detail: string,
  ) => {
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
  if (linked?.basic_info?.location?.full) {
    add(linked.basic_info.location.full, 'LinkedIn profile', 'Declared residence')
  }
  for (const ex of linked?.experience ?? []) {
    if (ex.location) add(ex.location, 'LinkedIn role', `${ex.title} · ${ex.company}`)
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

export function linkedinTopSkills(profile: LinkedInProfile | undefined, limit = 8): SkillRow[] {
  const skills = profile?.basic_info?.top_skills ?? []
  return skills.slice(0, limit).map((skill, i) => ({
    skill,
    weight: limit - i,
  }))
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
  li: LinkedInProfile[],
): CrossPlatformStat[] {
  const igP = ig[0]
  const liP = li[0]
  const twN = dedupeTweets(tw).length
  const handles = new Set<string>()
  if (igP?.username) handles.add(`@${igP.username}`)
  const twUser = dedupeTweets(tw)[0]?.['author.userName']
  if (twUser) handles.add(`@${twUser}`)
  if (liP?.basic_info?.public_identifier)
    handles.add(`in/${liP.basic_info.public_identifier}`)

  const externalDomains = new Set<string>()
  for (const u of igP?.externalUrls ?? []) {
    try {
      externalDomains.add(new URL(u.url).hostname.replace(/^www\./, ''))
    } catch {
      /* ignore */
    }
  }

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
      label: 'LinkedIn network',
      value: liP
        ? `${liP.basic_info.follower_count.toLocaleString()} followers`
        : '—',
      hint: 'Professional graph enriches targeting',
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
  li: LinkedInProfile[],
): string | null {
  return li[0]?.basic_info?.fullname ?? ig[0]?.fullName ?? null
}
