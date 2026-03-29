import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildMapMarkers,
  crossPlatformStats,
  filterAuthoredLinkedInPosts,
  instagramMediaMix,
  linkedinActivityByMonth,
  linkedinCareerRows,
  linkedinEngagementTotals,
  linkedinReactionMix,
  linkedinTopHashtags,
  linkedinTopSkills,
  resolvedTargetName,
  twitterActivityByMonth,
} from '../lib/analyzeDatasets'
import { loadDatasets, type LoadedDatasets } from '../lib/loadDatasets'
import { DatasetContext, type DatasetContextValue } from './datasetContextState'

const emptyEngagement = {
  posts: 0,
  reactionRecords: 0,
  comments: 0,
  shares: 0,
  uniqueReactors: 0,
}

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LoadedDatasets | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadDatasets(import.meta.env.BASE_URL)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load datasets')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<DatasetContextValue>(() => {
    const ig = data?.instagram ?? []
    const tw = data?.twitter ?? []
    const li = data?.linkedinProfile ?? []
    const liPosts = data?.linkedinPosts ?? []
    const liP = li[0]
    const authored = filterAuthoredLinkedInPosts(liPosts, liP)

    return {
      data,
      error,
      loading,
      targetName: resolvedTargetName(ig, li),
      mapMarkers: data ? buildMapMarkers(ig, li) : [],
      twitterByMonth: data ? twitterActivityByMonth(tw) : [],
      mediaMix: data ? instagramMediaMix(ig[0]) : [],
      skills: data ? linkedinTopSkills(liP) : [],
      stats: data ? crossPlatformStats(ig, tw, li, liPosts) : [],
      linkedinAuthoredPosts: authored,
      linkedinByMonth: data ? linkedinActivityByMonth(authored) : [],
      linkedinReactionMix: data ? linkedinReactionMix(authored) : [],
      linkedinHashtags: data ? linkedinTopHashtags(authored) : [],
      linkedinEngagement: data ? linkedinEngagementTotals(authored) : emptyEngagement,
      linkedinCareer: data ? linkedinCareerRows(liP) : [],
    }
  }, [data, error, loading])

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  )
}
