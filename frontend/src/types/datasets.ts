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

/** LinkedIn profile export (dataset_linkedin_profile.json) */
export type LinkedInPosition = {
  title?: string
  companyName?: string
  description?: string
  locationName?: string
  companyUrl?: string
  startYear?: number
  startMonth?: number
  endYear?: number
  endMonth?: number
  current?: boolean
  durationYear?: number
  durationMonth?: number
  skills?: string
}

export type LinkedInEducation = {
  schoolName?: string
  degreeName?: string
  fieldOfStudy?: string
  startYear?: number
  startMonth?: number
  endYear?: number
  endMonth?: number
}

export type LinkedInSkillEntry = {
  skillName?: string
}

export type LinkedInCertification = {
  name?: string
  authority?: string
  startYear?: number
  startMonth?: number
  durationYear?: number
  durationMonth?: number
}

export type LinkedInProfileRecord = {
  firstName?: string
  lastName?: string
  headline?: string
  locationName?: string
  publicIdentifier?: string
  summary?: string
  picture?: string
  url?: string
  positions?: LinkedInPosition[]
  educations?: LinkedInEducation[]
  skills?: LinkedInSkillEntry[]
  certifications?: LinkedInCertification[]
  verified?: boolean
  openToWork?: boolean
  premium?: boolean
  joinedDate?: string
  profilePhotoUpdated?: string
  contactInfoUpdated?: string
}

export type LinkedInReactorProfile = {
  firstName?: string
  lastName?: string
  occupation?: string
  publicId?: string
  profileId?: string
  picture?: string
  backgroundImage?: string
}

export type LinkedInReaction = {
  type?: string
  profile?: LinkedInReactorProfile
}

export type LinkedInComment = {
  time?: number
  text?: string
  link?: string
  author?: LinkedInReactorProfile
}

export type LinkedInPostAuthor = {
  firstName?: string
  lastName?: string
  occupation?: string
  publicId?: string
  profileId?: string
  picture?: string
  backgroundImage?: string
}

/** LinkedIn activity feed (dataset_linkedin-post.json) */
export type LinkedInPost = {
  type?: string
  images?: string[]
  isActivity?: boolean
  urn?: string
  url?: string
  timeSincePosted?: string
  text?: string
  numLikes?: number
  numComments?: number
  numShares?: number
  reactions?: LinkedInReaction[]
  comments?: LinkedInComment[]
  postedAtISO?: string
  postedAtTimestamp?: number
  shareAudience?: string
  author?: LinkedInPostAuthor
  authorName?: string
  authorProfileUrl?: string
  authorProfileId?: string
}
