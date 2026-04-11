import { createContext } from 'react'
import type { ImporterStoreApi } from './importer-store'

export const ImporterStoreContext = createContext<ImporterStoreApi | null>(null)
