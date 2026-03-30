import type { PlatformHandles } from '../context/ScanFlowContext'
import type { LoadedDatasets } from './loadDatasets'
import type { AiInsightsBundle } from '../types/aiInsights'
import type { CollectErrorKey } from '../context/datasetContextState'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

export type HealthResponse = {
  status: string
  service: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(apiUrl('/api/health/'))
  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }
  return res.json()
}

export type CollectSuccess = {
  ok: true
  data: LoadedDatasets
  errors: Partial<Record<CollectErrorKey, string>>
}

export type CollectFailure = {
  ok: false
  error: string
  data?: LoadedDatasets
}

export async function collectOsint(handles: PlatformHandles): Promise<CollectSuccess | CollectFailure> {
  const body: Record<string, string> = {}
  if (handles.linkedin.trim()) body.linkedin = handles.linkedin.trim()
  if (handles.instagram.trim()) body.instagram = handles.instagram.trim()
  if (handles.twitter.trim()) body.twitter = handles.twitter.trim()

  const res = await fetch(apiUrl('/api/collect/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const j = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    return {
      ok: false,
      error: typeof j.error === 'string' ? j.error : `API error ${res.status}`,
      data: j.data as LoadedDatasets | undefined,
    }
  }

  const data = j.data as LoadedDatasets
  const errors = (j.errors ?? {}) as Partial<Record<CollectErrorKey, string>>
  return { ok: true, data, errors }
}

export type AiInsightsOk = { ok: true } & AiInsightsBundle

export type AiInsightsResponse =
  | AiInsightsOk
  | { ok: false; error: string; detail?: string }

export async function fetchAiInsights(datasets: LoadedDatasets): Promise<AiInsightsResponse> {
  const res = await fetch(apiUrl('/api/ai/insights/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasets }),
  })

  const j = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    return {
      ok: false,
      error: typeof j.error === 'string' ? j.error : `API error ${res.status}`,
      detail: typeof j.detail === 'string' ? j.detail : undefined,
    }
  }

  if (j.ok !== true) {
    return { ok: false, error: 'Unexpected response' }
  }

  return j as AiInsightsResponse
}
