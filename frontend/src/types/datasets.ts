export type InstagramExternalUrl = {
  title?: string
  url: string
  link_type?: string
}

export type InstagramLocation = {
  id: string
  name: string
  slug?: string
}

export type InstagramPost = {
  id: string
  shortCode: string
  url: string
  caption: string | null
  mediaType: string
  productType: string | null
  location: InstagramLocation | null
  locationName: string | null
  likesCount: number
  commentsCount: number
  timestamp: string
  displayUrl: string
  alt: string | null
  is_video: boolean
}

export type InstagramProfile = {
  id: string
  username: string
  fullName: string
  biography: string
  followersCount: number
  followsCount: number
  postsCount: number
  highlight_reel_count: number
  verified: boolean
  private: boolean
  externalUrls: InstagramExternalUrl[]
  profilePicUrl: string
  hdProfilePicUrl?: string
  latestPosts: InstagramPost[]
}

export type TwitterTweet = {
  text: string
  'author.name': string
  'author.userName': string
  likeCount: number
  retweetCount: number
  replyCount: number
  viewCount: number
  createdAt: string
  url: string
}

export type LinkedInLocation = {
  country: string
  city?: string
  full: string
  country_code?: string
}

export type LinkedInExperience = {
  title: string
  company: string
  location: string
  description?: string
  duration: string
  is_current?: boolean
  employment_type?: string
  location_type?: string
}

export type LinkedInEducation = {
  school: string
  degree: string
  field_of_study?: string
  duration: string
}

export type LinkedInBasicInfo = {
  fullname: string
  headline: string
  public_identifier: string
  profile_url: string
  profile_picture_url: string
  background_picture_url?: string
  about: string
  location: LinkedInLocation
  follower_count: number
  connection_count: number
  top_skills: string[]
}

export type LinkedInProfile = {
  basic_info: LinkedInBasicInfo
  experience: LinkedInExperience[]
  education: LinkedInEducation[]
  projects: { name: string; description: string }[]
  certifications: { name: string; issuer: string; issued_date: string }[]
}
