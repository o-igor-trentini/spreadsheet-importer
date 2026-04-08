import { createContext, useRef, type ReactNode } from 'react'
import {
  createImporterStore,
  type ImporterStoreApi,
} from './importer-store'
import type { StateStorage } from 'zustand/middleware'

export const ImporterStoreContext = createContext<ImporterStoreApi | null>(null)

export interface StoreProviderProps {
  children: ReactNode
  sessionKey?: string
  storage?: StateStorage
}

export function StoreProvider({
  children,
  sessionKey,
  storage,
}: StoreProviderProps) {
  const storeRef = useRef<ImporterStoreApi | null>(null)

  if (storeRef.current === null) {
    storeRef.current = createImporterStore({ sessionKey, storage })
  }

  return (
    <ImporterStoreContext.Provider value={storeRef.current}>
      {children}
    </ImporterStoreContext.Provider>
  )
}
