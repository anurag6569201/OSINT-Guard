import type {
  InstagramProfile,
  LinkedInPost,
  LinkedInProfileRecord,
  TwitterTweet,
} from '../types/datasets'

export type LoadedDatasets = {
  instagram: InstagramProfile[]
  twitter: TwitterTweet[]
  linkedinProfile: LinkedInProfileRecord[]
  linkedinPosts: LinkedInPost[]
}

/** Join Vite `import.meta.env.BASE_URL` (always ends with `/`) to a public path without producing `//host` (breaks DNS). */
function publicUrl(baseUrl: string, path: string) {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const p = path.replace(/^\//, '')
  return `${root}${p}`
}

export async function loadDatasets(baseUrl = '/'): Promise<LoadedDatasets> {
  const [instagram, twitter, linkedinProfile, linkedinPosts] = await Promise.all([
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_instagram.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load Instagram dataset')
      return r.json() as Promise<InstagramProfile[]>
    }),
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_twitter.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load Twitter dataset')
      return r.json() as Promise<TwitterTweet[]>
    }),
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_linkedin_profile.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load LinkedIn profile dataset')
      return r.json() as Promise<LinkedInProfileRecord[]>
    }),
    fetch(publicUrl(baseUrl, 'dummy_data/dataset_linkedin-post.json')).then((r) => {
      if (!r.ok) throw new Error('Failed to load LinkedIn posts dataset')
      return r.json() as Promise<LinkedInPost[]>
    }),
  ])
  return { instagram, twitter, linkedinProfile, linkedinPosts }
}
