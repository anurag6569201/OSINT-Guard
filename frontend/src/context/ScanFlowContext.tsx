/* eslint-disable react-refresh/only-export-components -- provider + hook pair */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { HANDLES_STORAGE_KEY } from '../lib/scanSession'

export type PlatformHandles = {
  linkedin: string
  instagram: string
  twitter: string
}

export type ScanFlowValue = {
  handles: PlatformHandles
  setHandle: (platform: keyof PlatformHandles, value: string) => void
  canSubmit: boolean
}

const defaultHandles: PlatformHandles = {
  linkedin: '',
  instagram: '',
  twitter: '',
}

const ScanFlowContext = createContext<ScanFlowValue | null>(null)

function normalizeHandle(raw: string) {
  return raw.replace(/^@+/g, '').trim()
}

function readStoredHandles(): PlatformHandles {
  try {
    const raw = localStorage.getItem(HANDLES_STORAGE_KEY)
    if (!raw) return defaultHandles
    const p = JSON.parse(raw) as unknown
    if (!p || typeof p !== 'object') return defaultHandles
    const o = p as Record<string, unknown>
    return {
      linkedin: normalizeHandle(String(o.linkedin ?? '')),
      instagram: normalizeHandle(String(o.instagram ?? '')),
      twitter: normalizeHandle(String(o.twitter ?? '')),
    }
  } catch {
    return defaultHandles
  }
}

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const [handles, setHandles] = useState<PlatformHandles>(readStoredHandles)

  useEffect(() => {
    try {
      localStorage.setItem(HANDLES_STORAGE_KEY, JSON.stringify(handles))
    } catch {
      /* quota / private mode */
    }
  }, [handles])

  const setHandle = useCallback((platform: keyof PlatformHandles, value: string) => {
    setHandles((h) => ({ ...h, [platform]: normalizeHandle(value) }))
  }, [])

  const canSubmit = Boolean(
    handles.linkedin || handles.instagram || handles.twitter,
  )

  const value = useMemo<ScanFlowValue>(
    () => ({
      handles,
      setHandle,
      canSubmit,
    }),
    [handles, setHandle, canSubmit],
  )

  return (
    <ScanFlowContext.Provider value={value}>{children}</ScanFlowContext.Provider>
  )
}

export function useScanFlow() {
  const ctx = useContext(ScanFlowContext)
  if (!ctx) throw new Error('useScanFlow must be used within ScanFlowProvider')
  return ctx
}
