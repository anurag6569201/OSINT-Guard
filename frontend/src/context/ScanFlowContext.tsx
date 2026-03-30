/* eslint-disable react-refresh/only-export-components -- provider + hook pair */
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

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const [handles, setHandles] = useState<PlatformHandles>(defaultHandles)

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
