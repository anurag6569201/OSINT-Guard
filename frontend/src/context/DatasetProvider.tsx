import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
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
import { collectOsint, fetchLatestScan } from '../lib/api'
import { consumeForceCollect, handlesMatchSnapshot } from '../lib/scanSession'
import { loadDatasets, type LoadedDatasets } from '../lib/loadDatasets'
import { DatasetContext, type CollectErrorKey, type DatasetContextValue } from './datasetContextState'
import { useScanFlow } from './ScanFlowContext'

const emptyEngagement = {
  posts: 0,
  reactionRecords: 0,
  comments: 0,
  shares: 0,
  uniqueReactors: 0,
}

function useDummyDataMode() {
  return import.meta.env.VITE_USE_DUMMY_DATA === 'true'
}

function datasetsHasAnyRows(d: LoadedDatasets | null | undefined): boolean {
  if (!d) return false
  return (
    (d.instagram?.length ?? 0) +
      (d.twitter?.length ?? 0) +
      (d.linkedinProfile?.length ?? 0) +
      (d.linkedinPosts?.length ?? 0) >
    0
  )
}

export function DatasetProvider({ children }: { children: ReactNode }) {
  const useDummy = useDummyDataMode()
  const location = useLocation()
  const { handles } = useScanFlow()
  const [data, setData] = useState<LoadedDatasets | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [collectErrors, setCollectErrors] = useState<Partial<
    Record<CollectErrorKey, string>
  > | null>(null)
  const [dataSource, setDataSource] = useState<'dummy' | 'live'>('dummy')

  const handleKey = `${handles.linkedin}\0${handles.instagram}\0${handles.twitter}`

  useEffect(() => {
    let cancelled = false

    if (useDummy) {
      setDataSource('dummy')
      setCollectErrors(null)
      setLoading(true)
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
    }

    if (location.pathname !== '/analysis') {
      setData(null)
      setError(null)
      setCollectErrors(null)
      setLoading(false)
      setDataSource('live')
      return () => {
        cancelled = true
      }
    }

    setDataSource('live')
    setLoading(true)
    setError(null)
    setCollectErrors(null)
    setData(null)

    const forceCollect = consumeForceCollect()

    void (async () => {
      try {
        if (!forceCollect) {
          let latest: Awaited<ReturnType<typeof fetchLatestScan>> = null
          try {
            latest = await fetchLatestScan()
          } catch {
            latest = null
          }
          if (
            !cancelled &&
            latest &&
            handlesMatchSnapshot(handles, latest) &&
            datasetsHasAnyRows(latest.datasets)
          ) {
            setData(latest.datasets)
            const ce = latest.collect_errors ?? {}
            setCollectErrors(
              Object.keys(ce).length ? (ce as Partial<Record<CollectErrorKey, string>>) : null,
            )
            setError(null)
            return
          }
        }

        if (cancelled) return
        setData(null)
        const res = await collectOsint(handles)
        if (cancelled) return
        if (!res.ok) {
          const partial = res.data
          setData(datasetsHasAnyRows(partial) ? partial! : null)
          setError(res.error)
          setCollectErrors(null)
          return
        }
        setData(res.data)
        const errs = res.errors
        setCollectErrors(Object.keys(errs).length ? errs : null)
        setError(null)
      } catch (e: unknown) {
        if (!cancelled) {
          setData(null)
          setError(e instanceof Error ? e.message : 'Collection failed')
          setCollectErrors(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [useDummy, location.pathname, handleKey]) // eslint-disable-line react-hooks/exhaustive-deps -- handleKey snapshots handles for /analysis

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
      dataSource,
      collectErrors,
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
  }, [data, error, loading, dataSource, collectErrors])

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  )
}
