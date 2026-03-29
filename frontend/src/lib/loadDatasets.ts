import type {
  InstagramProfile,
  LinkedInProfile,
  TwitterTweet,
} from '../types/datasets'

export type LoadedDatasets = {
  instagram: InstagramProfile[]
  twitter: TwitterTweet[]
  linkedin: LinkedInProfile[]
}

/** Join Vite `import.meta.env.BASE_URL` (always ends with `/`) to a public path without producing `//host` (breaks DNS). */
function publicUrl(baseUrl: string, path: string) {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const p = path.replace(/^\//, '')
  return `${root}${p}`
}

export async function loadDatasets(baseUrl = '/'): Promise<LoadedDatasets> {
  const [instagram, twitter, linkedin] = await Promise.all([
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_instagram.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load Instagram dataset')
      return r.json() as Promise<InstagramProfile[]>
    }),
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_twitter.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load Twitter dataset')
      return r.json() as Promise<TwitterTweet[]>
    }),
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_linkedin.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load LinkedIn dataset')
      return r.json() as Promise<LinkedInProfile[]>
    }),
  ])
  return { instagram, twitter, linkedin }
}
