import { describe, it, expect, beforeEach } from 'vitest'
import { createImporterStore } from '../importer-store'
import type { ImporterStoreApi } from '../importer-store'
import type { StateStorage } from 'zustand/middleware'

function createMemoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value)
    },
    removeItem: (name) => {
      data.delete(name)
    },
  }
}

describe('importer-store', () => {
  let store: ImporterStoreApi

  beforeEach(() => {
    store = createImporterStore({ sessionKey: 'test', storage: createMemoryStorage() })
  })

  describe('initial state', () => {
    it('starts at upload step', () => {
      expect(store.getState().step).toBe('upload')
    })

    it('starts with no file data', () => {
      expect(store.getState().fileName).toBeNull()
      expect(store.getState().fileData).toBeNull()
      expect(store.getState().sourceColumns).toEqual([])
      expect(store.getState().previewData).toEqual([])
      expect(store.getState().totalRows).toBe(0)
    })

    it('starts with empty mappings', () => {
      expect(store.getState().mappings).toEqual([])
    })

    it('starts with no validation result', () => {
      expect(store.getState().validationResult).toBeNull()
    })

    it('starts not processing and no error', () => {
      expect(store.getState().isProcessing).toBe(false)
      expect(store.getState().error).toBeNull()
    })
  })

  describe('state transitions', () => {
    it('setStep changes the current step', () => {
      store.getState().setStep('mapping')
      expect(store.getState().step).toBe('mapping')

      store.getState().setStep('validation')
      expect(store.getState().step).toBe('validation')

      store.getState().setStep('review')
      expect(store.getState().step).toBe('review')
    })

    it('setFileData updates file-related state and clears error', () => {
      store.getState().setError('some error')

      const buffer = new ArrayBuffer(8)
      store.getState().setFileData({
        fileName: 'test.csv',
        fileData: buffer,
        sourceColumns: [
          { index: 0, header: 'Nome', sampleValues: ['Alice', 'Bob'] },
        ],
        previewData: [['Alice'], ['Bob']],
        totalRows: 2,
      })

      const state = store.getState()
      expect(state.fileName).toBe('test.csv')
      expect(state.fileData).toBe(buffer)
      expect(state.sourceColumns).toHaveLength(1)
      expect(state.sourceColumns[0].header).toBe('Nome')
      expect(state.previewData).toEqual([['Alice'], ['Bob']])
      expect(state.totalRows).toBe(2)
      expect(state.error).toBeNull()
    })

    it('setMappings updates mappings', () => {
      const mappings = [
        { targetKey: 'origin', sourceIndex: 0, confidence: 1.0 },
        { targetKey: 'destination', sourceIndex: 1, confidence: 0.8 },
      ]
      store.getState().setMappings(mappings)
      expect(store.getState().mappings).toEqual(mappings)
    })

    it('setValidationResult updates validation result', () => {
      const result = {
        isValid: false,
        totalRows: 100,
        validRows: 95,
        issues: [
          {
            row: 5,
            columnKey: 'origin',
            severity: 'error' as const,
            message: 'Campo obrigatório',
            value: null,
          },
        ],
        errorCount: 5,
        warningCount: 0,
      }
      store.getState().setValidationResult(result)
      expect(store.getState().validationResult).toEqual(result)

      store.getState().setValidationResult(null)
      expect(store.getState().validationResult).toBeNull()
    })

    it('setProcessing updates processing flag', () => {
      store.getState().setProcessing(true)
      expect(store.getState().isProcessing).toBe(true)

      store.getState().setProcessing(false)
      expect(store.getState().isProcessing).toBe(false)
    })

    it('setError sets error and clears processing', () => {
      store.getState().setProcessing(true)
      store.getState().setError('Arquivo inválido')

      expect(store.getState().error).toBe('Arquivo inválido')
      expect(store.getState().isProcessing).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      store.getState().setStep('validation')
      store.getState().setFileData({
        fileName: 'test.csv',
        fileData: new ArrayBuffer(8),
        sourceColumns: [{ index: 0, header: 'A', sampleValues: [] }],
        previewData: [['a']],
        totalRows: 1,
      })
      store.getState().setMappings([{ targetKey: 'x', sourceIndex: 0 }])
      store.getState().setProcessing(true)
      store.getState().setError('err')

      store.getState().reset()

      const state = store.getState()
      expect(state.step).toBe('upload')
      expect(state.fileName).toBeNull()
      expect(state.fileData).toBeNull()
      expect(state.sourceColumns).toEqual([])
      expect(state.previewData).toEqual([])
      expect(state.totalRows).toBe(0)
      expect(state.mappings).toEqual([])
      expect(state.validationResult).toBeNull()
      expect(state.isProcessing).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('persist / rehydrate', () => {
    it('persists partitioned state and rehydrates it', async () => {
      const storage = createMemoryStorage()

      const store1 = createImporterStore({ sessionKey: 'persist-test', storage })
      store1.getState().setStep('mapping')
      store1.getState().setFileData({
        fileName: 'dados.xlsx',
        fileData: new ArrayBuffer(16),
        sourceColumns: [
          { index: 0, header: 'Origem', sampleValues: ['SP'] },
        ],
        previewData: [['SP']],
        totalRows: 50,
      })
      store1.getState().setMappings([
        { targetKey: 'origin', sourceIndex: 0, confidence: 1.0 },
      ])

      // Verify data was written to storage
      const persisted = storage.data.get('spreadsheet-importer-persist-test')
      expect(persisted).toBeDefined()

      const parsed = JSON.parse(persisted!)
      const persistedState = parsed.state

      // Should persist these fields
      expect(persistedState.step).toBe('mapping')
      expect(persistedState.fileName).toBe('dados.xlsx')
      expect(persistedState.sourceColumns).toHaveLength(1)
      expect(persistedState.previewData).toEqual([['SP']])
      expect(persistedState.totalRows).toBe(50)
      expect(persistedState.mappings).toHaveLength(1)

      // Should NOT persist fileData or validationResult
      expect(persistedState.fileData).toBeUndefined()
      expect(persistedState.validationResult).toBeUndefined()
      expect(persistedState.isProcessing).toBeUndefined()
      expect(persistedState.error).toBeUndefined()
    })

    it('uses sessionKey in persist key', () => {
      const storage = createMemoryStorage()

      const storeA = createImporterStore({ sessionKey: 'alpha', storage })
      storeA.getState().setStep('mapping')

      const storeB = createImporterStore({ sessionKey: 'beta', storage })
      storeB.getState().setStep('validation')

      expect(storage.data.has('spreadsheet-importer-alpha')).toBe(true)
      expect(storage.data.has('spreadsheet-importer-beta')).toBe(true)
    })

    it('defaults sessionKey to "default"', () => {
      const storage = createMemoryStorage()
      const s = createImporterStore({ storage })
      s.getState().setStep('mapping')

      expect(storage.data.has('spreadsheet-importer-default')).toBe(true)
    })
  })
})
