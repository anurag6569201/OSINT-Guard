import { createContext } from 'react'
import type {
  CareerRow,
  CrossPlatformStat,
  HashtagRow,
  LinkedInEngagementTotals,
  LinkedInMonthRow,
  MapMarker,
  MediaTypeRow,
  ReactionMixRow,
  SkillRow,
  TwitterMonthRow,
} from '../lib/analyzeDatasets'
import type { LoadedDatasets } from '../lib/loadDatasets'
import type { LinkedInPost } from '../types/datasets'

export type DatasetContextValue = {
  data: LoadedDatasets | null
  error: string | null
  loading: boolean
  targetName: string | null
  mapMarkers: MapMarker[]
  twitterByMonth: TwitterMonthRow[]
  mediaMix: MediaTypeRow[]
  skills: SkillRow[]
  stats: CrossPlatformStat[]
  linkedinAuthoredPosts: LinkedInPost[]
  linkedinByMonth: LinkedInMonthRow[]
  linkedinReactionMix: ReactionMixRow[]
  linkedinHashtags: HashtagRow[]
  linkedinEngagement: LinkedInEngagementTotals
  linkedinCareer: CareerRow[]
}

export const DatasetContext = createContext<DatasetContextValue | null>(null)
