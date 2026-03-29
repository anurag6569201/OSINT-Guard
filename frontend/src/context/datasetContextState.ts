import { createContext } from 'react'
import type {
  CrossPlatformStat,
  MapMarker,
  MediaTypeRow,
  SkillRow,
  TwitterMonthRow,
} from '../lib/analyzeDatasets'
import type { LoadedDatasets } from '../lib/loadDatasets'

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
}

export const DatasetContext = createContext<DatasetContextValue | null>(null)
