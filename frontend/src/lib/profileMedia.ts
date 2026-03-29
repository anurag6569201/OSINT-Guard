import type { LoadedDatasets } from './loadDatasets'

export type ProfileMediaSource = 'linkedin' | 'twitter' | 'instagram'

function twitterHandle(data: LoadedDatasets | null): string | null {
  const row = data?.twitter?.find((t) => t['author.userName'])
  const u = row?.['author.userName']
  if (!u) return null
  return u.replace(/^@/, '')
}

/** Banner: LinkedIn cover → first Instagram post image (Twitter exports rarely include banners). */
export function pickBanner(data: LoadedDatasets | null): {
  url: string | null
  source: ProfileMediaSource | null
} {
  const bg = data?.linkedin?.[0]?.basic_info?.background_picture_url
  if (bg) return { url: bg, source: 'linkedin' }

  const firstPost = data?.instagram?.[0]?.latestPosts?.[0]?.displayUrl
  if (firstPost) return { url: firstPost, source: 'instagram' }

  return { url: null, source: null }
}

/** Avatar: LinkedIn → Unavatar/X by handle → Instagram profile. */
export function pickAvatar(data: LoadedDatasets | null): {
  url: string | null
  source: ProfileMediaSource | null
} {
  const liPic = data?.linkedin?.[0]?.basic_info?.profile_picture_url
  if (liPic) return { url: liPic, source: 'linkedin' }

  const handle = twitterHandle(data)
  if (handle) {
    return {
      url: `https://unavatar.io/x/${encodeURIComponent(handle)}`,
      source: 'twitter',
    }
  }

  const ig = data?.instagram?.[0]
  const igPic = ig?.hdProfilePicUrl ?? ig?.profilePicUrl
  if (igPic) return { url: igPic, source: 'instagram' }

  return { url: null, source: null }
}

export function pickHeadline(data: LoadedDatasets | null): string | null {
  const h = data?.linkedin?.[0]?.basic_info?.headline
  return h?.trim() ? h : null
}
