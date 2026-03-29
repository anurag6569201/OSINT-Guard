import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildMapMarkers,
  crossPlatformStats,
  instagramMediaMix,
  linkedinTopSkills,
  resolvedTargetName,
  twitterActivityByMonth,
} from '../lib/analyzeDatasets'
import { loadDatasets, type LoadedDatasets } from '../lib/loadDatasets'
import { DatasetContext, type DatasetContextValue } from './datasetContextState'

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
    const li = data?.linkedin ?? []
    return {
      data,
      error,
      loading,
      targetName: resolvedTargetName(ig, li),
      mapMarkers: data ? buildMapMarkers(ig, li) : [],
      twitterByMonth: data ? twitterActivityByMonth(tw) : [],
      mediaMix: data ? instagramMediaMix(ig[0]) : [],
      skills: data ? linkedinTopSkills(li[0]) : [],
      stats: data ? crossPlatformStats(ig, tw, li) : [],
    }
  }, [data, error, loading])

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  )
}
