import { useState, type ReactNode } from 'react'
import {
  createImporterStore,
  type ImporterStoreApi,
} from './importer-store'
import { ImporterStoreContext } from './importer-store-context'
import type { StateStorage } from 'zustand/middleware'

export { ImporterStoreContext } from './importer-store-context'

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
  const [store] = useState<ImporterStoreApi>(() =>
    createImporterStore({ sessionKey, storage }),
  )

  return (
    <ImporterStoreContext.Provider value={store}>
      {children}
    </ImporterStoreContext.Provider>
  )
}
