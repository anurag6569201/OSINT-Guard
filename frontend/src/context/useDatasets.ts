import { useContext } from 'react'
import { DatasetContext } from './datasetContextState'

export function useDatasets() {
  const ctx = useContext(DatasetContext)
  if (!ctx) throw new Error('useDatasets must be used within DatasetProvider')
  return ctx
}
