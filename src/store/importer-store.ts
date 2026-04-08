import { createStore } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import type { ImporterStore, ImporterState } from '@/types/store'

const initialState: ImporterState = {
  step: 'upload',
  fileName: null,
  fileData: null,
  sourceColumns: [],
  previewData: [],
  totalRows: 0,
  mappings: [],
  validationResult: null,
  isProcessing: false,
  error: null,
}

export interface CreateImporterStoreOptions {
  sessionKey?: string
  storage?: StateStorage
}

export function createImporterStore(options: CreateImporterStoreOptions = {}) {
  const { sessionKey, storage } = options
  const persistKey = `spreadsheet-importer-${sessionKey ?? 'default'}`

  return createStore<ImporterStore>()(
    persist(
      (set) => ({
        ...initialState,

        setStep: (step) => set({ step }),

        setFileData: (data) =>
          set({
            fileName: data.fileName,
            fileData: data.fileData,
            sourceColumns: data.sourceColumns,
            previewData: data.previewData,
            totalRows: data.totalRows,
            error: null,
          }),

        setMappings: (mappings) => set({ mappings }),

        setValidationResult: (validationResult) => set({ validationResult }),

        setProcessing: (isProcessing) => set({ isProcessing }),

        setError: (error) => set({ error, isProcessing: false }),

        reset: () => set(initialState),
      }),
      {
        name: persistKey,
        storage: createJSONStorage(() => storage ?? localStorage),
        partialize: (state) => ({
          step: state.step,
          fileName: state.fileName,
          sourceColumns: state.sourceColumns,
          previewData: state.previewData,
          totalRows: state.totalRows,
          mappings: state.mappings,
        }),
      },
    ),
  )
}

export type ImporterStoreApi = ReturnType<typeof createImporterStore>
