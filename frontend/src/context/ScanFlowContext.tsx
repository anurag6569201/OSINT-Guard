import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type PlatformHandles = {
  linkedin: string
  instagram: string
  twitter: string
}

export type ScanPhase = 'landing' | 'analysis'

export type ScanFlowValue = {
  phase: ScanPhase
  handles: PlatformHandles
  setHandle: (platform: keyof PlatformHandles, value: string) => void
  submitScan: () => void
  resetToLanding: () => void
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

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ScanPhase>('landing')
  const [handles, setHandles] = useState<PlatformHandles>(defaultHandles)

  const setHandle = useCallback((platform: keyof PlatformHandles, value: string) => {
    setHandles((h) => ({ ...h, [platform]: normalizeHandle(value) }))
  }, [])

  const canSubmit = Boolean(
    handles.linkedin || handles.instagram || handles.twitter,
  )

  const submitScan = useCallback(() => {
    if (!canSubmit) return
    setPhase('analysis')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [canSubmit])

  const resetToLanding = useCallback(() => {
    setPhase('landing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const value = useMemo<ScanFlowValue>(
    () => ({
      phase,
      handles,
      setHandle,
      submitScan,
      resetToLanding,
      canSubmit,
    }),
    [phase, handles, setHandle, submitScan, resetToLanding, canSubmit],
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
