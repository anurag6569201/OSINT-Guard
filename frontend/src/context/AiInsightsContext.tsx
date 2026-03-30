/* eslint-disable react-refresh/only-export-components -- provider + hook pair */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import {
  executive as executiveDummy,
  inferenceRows as inferenceDummy,
  methodology as methodologyDummy,
  patternOfLife as patternDummy,
  phishingSims as phishingDummy,
  polInference as polInferenceDummy,
} from '../data/osintDummy'
import { fetchAiInsights } from '../lib/api'
import type { PipelineStage } from '../types/analysisPipeline'
import type { AiInsightsBundle } from '../types/aiInsights'
import { useDatasets } from './useDatasets'

type AiInsightsContextValue = {
  bundle: AiInsightsBundle | null
  loading: boolean
  error: string | null
  usedLiveAi: boolean
  pipelineStage: PipelineStage
  pipelineLoading: boolean
}

const AiInsightsContext = createContext<AiInsightsContextValue | null>(null)

function useDummyDataMode() {
  return import.meta.env.VITE_USE_DUMMY_DATA === 'true'
}

function normalizeBundle(raw: Partial<Record<keyof AiInsightsBundle, unknown>>): AiInsightsBundle | null {
  const ex = raw.executive
  if (!ex || typeof ex !== 'object') return null
  const e = ex as Record<string, unknown>
  return {
    executive: {
      riskScore: Number(e.riskScore ?? 0),
      riskMax: Number(e.riskMax ?? 100),
      riskLabel: String(e.riskLabel ?? ''),
      summary: String(e.summary ?? ''),
    },
    inferenceRows: Array.isArray(raw.inferenceRows)
      ? (raw.inferenceRows as AiInsightsBundle['inferenceRows'])
      : [],
    patternOfLife: Array.isArray(raw.patternOfLife)
      ? (raw.patternOfLife as AiInsightsBundle['patternOfLife'])
      : [],
    polInference: String(raw.polInference ?? ''),
    phishingSims: Array.isArray(raw.phishingSims)
      ? (raw.phishingSims as AiInsightsBundle['phishingSims'])
      : [],
    methodology:
      raw.methodology && typeof raw.methodology === 'object'
        ? (raw.methodology as AiInsightsBundle['methodology'])
        : { headline: '', intro: '', pillars: [] },
  }
}

export function AiInsightsProvider({ children }: { children: ReactNode }) {
  const useDummy = useDummyDataMode()
  const location = useLocation()
  const { data, loading: dataLoading, dataSource } = useDatasets()
  const [bundle, setBundle] = useState<AiInsightsBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!useDummy && dataSource === 'live' && dataLoading && location.pathname === '/analysis') {
      /* eslint-disable react-hooks/set-state-in-effect -- reset stale Gemini output when re-running Apify */
      setBundle(null)
      setError(null)
      setLoading(false)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [useDummy, dataSource, dataLoading, location.pathname])

  /* eslint-disable react-hooks/set-state-in-effect -- route + dataset driven fetch lifecycle */
  useEffect(() => {
    if (useDummy || location.pathname !== '/analysis' || dataSource !== 'live') {
      setBundle(null)
      setLoading(false)
      setError(null)
      return
    }
    if (dataLoading || !data) {
      return
    }

    let cancelled = false
    setBundle(null)
    setError(null)
    setLoading(true)

    fetchAiInsights(data)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setBundle(null)
          setError(res.error)
          return
        }
        const nb = normalizeBundle({
          executive: res.executive,
          inferenceRows: res.inferenceRows,
          patternOfLife: res.patternOfLife,
          polInference: res.polInference,
          phishingSims: res.phishingSims,
          methodology: res.methodology,
        })
        setBundle(nb)
        setError(nb ? null : 'Invalid AI response shape')
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setBundle(null)
          setError(err instanceof Error ? err.message : 'AI request failed')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useDummy, location.pathname, dataSource, dataLoading, data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const pipelineStage: PipelineStage = useMemo(() => {
    if (location.pathname !== '/analysis') return 'idle'
    if (useDummy && dataLoading) return 'demo_load'
    if (!useDummy && dataSource === 'live') {
      if (dataLoading) return 'collect'
      if (data != null && loading) return 'analyze'
    }
    return 'idle'
  }, [location.pathname, useDummy, dataLoading, dataSource, data, loading])

  const pipelineLoading = pipelineStage !== 'idle'

  const value = useMemo<AiInsightsContextValue>(
    () => ({
      bundle,
      loading,
      error,
      usedLiveAi: Boolean(bundle),
      pipelineStage,
      pipelineLoading,
    }),
    [bundle, loading, error, pipelineStage, pipelineLoading],
  )

  return (
    <AiInsightsContext.Provider value={value}>{children}</AiInsightsContext.Provider>
  )
}

export type NarrativeSource = 'demo' | 'gemini' | 'template'

export function useAiInsights() {
  const ctx = useContext(AiInsightsContext)
  const useDummy = useDummyDataMode()
  const b = ctx?.bundle

  const narrativeSource: NarrativeSource = useMemo(() => {
    if (useDummy) return 'demo'
    if (b) return 'gemini'
    return 'template'
  }, [useDummy, b])

  return {
    executive: b?.executive ?? executiveDummy,
    inferenceRows: b?.inferenceRows?.length ? b.inferenceRows : inferenceDummy,
    patternOfLife: b?.patternOfLife?.length ? b.patternOfLife : patternDummy,
    polInference: b?.polInference || polInferenceDummy,
    phishingSims: b?.phishingSims?.length ? b.phishingSims : phishingDummy,
    methodology: b?.methodology?.pillars?.length ? b.methodology : methodologyDummy,
    aiLoading: ctx?.loading ?? false,
    aiError: ctx?.error ?? null,
    usedLiveAi: Boolean(b) && !useDummy,
    pipelineLoading: ctx?.pipelineLoading ?? false,
    pipelineStage: ctx?.pipelineStage ?? 'idle',
    narrativeSource,
  }
}
