import { useContext } from 'react'
import { useStore } from 'zustand'
import { ImporterStoreContext } from '@/store/store-provider'
import type { ImporterStore } from '@/types/store'

export function useImporterStore<T>(selector: (state: ImporterStore) => T): T {
  const store = useContext(ImporterStoreContext)

  if (!store) {
    throw new Error(
      'useImporterStore must be used within a <StoreProvider>',
    )
  }

  return useStore(store, selector)
}
