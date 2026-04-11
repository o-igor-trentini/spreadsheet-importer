import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as XLSX from 'xlsx'
import { DataValidation } from '../DataValidation'
import {
  createImporterStore,
  type ImporterStoreApi,
} from '@/store/importer-store'
import { ImporterStoreContext } from '@/store/store-provider'
import type { TargetColumn } from '@/types/column'
import type { ReactNode } from 'react'
import type { StateStorage } from 'zustand/middleware'

const targetColumns: TargetColumn[] = [
  { key: 'origin', label: 'Origem', required: true, type: 'string' },
  { key: 'destination', label: 'Destino', required: true, type: 'string' },
]

function createMemoryStorage(): StateStorage {
  const data = new Map<string, string>()
  return {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => data.set(name, value),
    removeItem: (name) => data.delete(name),
  }
}

function createXlsxBuffer(
  headers: string[],
  data: (string | number)[][],
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const rows = [headers, ...data]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

function renderWithStore(
  ui: ReactNode,
  opts: { store?: ImporterStoreApi } = {},
) {
  const store =
    opts.store ??
    createImporterStore({ sessionKey: 'test', storage: createMemoryStorage() })
  return {
    store,
    ...render(
      <ImporterStoreContext.Provider value={store}>
        {ui}
      </ImporterStoreContext.Provider>,
    ),
  }
}

function setupStoreWithValidData(store: ImporterStoreApi) {
  const buffer = createXlsxBuffer(
    ['Origem', 'Destino'],
    [
      ['São Paulo', 'Rio'],
      ['Curitiba', 'Floripa'],
    ],
  )
  store.getState().setFileData({
    fileName: 'test.xlsx',
    fileData: buffer,
    sourceColumns: [
      { index: 0, header: 'Origem', sampleValues: ['São Paulo'] },
      { index: 1, header: 'Destino', sampleValues: ['Rio'] },
    ],
    previewData: [['São Paulo', 'Rio'], ['Curitiba', 'Floripa']],
    totalRows: 2,
  })
  store.getState().setMappings([
    { targetKey: 'origin', sourceIndex: 0 },
    { targetKey: 'destination', sourceIndex: 1 },
  ])
}

function setupStoreWithInvalidData(store: ImporterStoreApi) {
  const buffer = createXlsxBuffer(
    ['Origem', 'Destino'],
    [
      ['São Paulo', 'Rio'],
      ['', 'Floripa'], // origin empty = required error
      ['Curitiba', ''], // destination empty = required error
    ],
  )
  store.getState().setFileData({
    fileName: 'test.xlsx',
    fileData: buffer,
    sourceColumns: [
      { index: 0, header: 'Origem', sampleValues: ['São Paulo'] },
      { index: 1, header: 'Destino', sampleValues: ['Rio'] },
    ],
    previewData: [['São Paulo', 'Rio'], ['', 'Floripa'], ['Curitiba', '']],
    totalRows: 3,
  })
  store.getState().setMappings([
    { targetKey: 'origin', sourceIndex: 0 },
    { targetKey: 'destination', sourceIndex: 1 },
  ])
}

describe('DataValidation', () => {
  describe('pre-existing validation result', () => {
    it('shows validation summary when result exists in store', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })

      store.getState().setValidationResult({
        isValid: true,
        totalRows: 10,
        validRows: 10,
        issues: [],
        errorCount: 0,
        warningCount: 0,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      const summary = screen.getByTestId('validation-summary')
      expect(summary.textContent).toContain('10 de 10 linhas válidas')
    })

    it('shows error count in summary', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      store.getState().setValidationResult({
        isValid: false,
        totalRows: 100,
        validRows: 95,
        issues: [
          { row: 1, columnKey: 'origin', severity: 'error', message: 'obrigatório', value: '' },
        ],
        errorCount: 5,
        warningCount: 2,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      expect(screen.getByText(/5 erros/)).toBeInTheDocument()
      expect(screen.getByText(/2 avisos/)).toBeInTheDocument()
    })

    it('disables Next button when there are errors', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      store.getState().setValidationResult({
        isValid: false,
        totalRows: 10,
        validRows: 8,
        issues: [{ row: 1, columnKey: 'origin', severity: 'error', message: 'err', value: '' }],
        errorCount: 2,
        warningCount: 0,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      expect(screen.getByTestId('next-button')).toBeDisabled()
    })

    it('enables Next button when validation passes', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      store.getState().setValidationResult({
        isValid: true,
        totalRows: 10,
        validRows: 10,
        issues: [],
        errorCount: 0,
        warningCount: 0,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      expect(screen.getByTestId('next-button')).not.toBeDisabled()
    })
  })

  describe('navigation callbacks', () => {
    it('calls onNext when Next is clicked', async () => {
      const user = userEvent.setup()
      const onNext = vi.fn()
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      store.getState().setValidationResult({
        isValid: true,
        totalRows: 5,
        validRows: 5,
        issues: [],
        errorCount: 0,
        warningCount: 0,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={onNext} onBack={vi.fn()} />,
        { store },
      )

      await user.click(screen.getByTestId('next-button'))
      expect(onNext).toHaveBeenCalledOnce()
    })

    it('calls onBack when Voltar is clicked', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={onBack} />,
        { store },
      )

      await user.click(screen.getByText('Voltar'))
      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('auto-validation on mount', () => {
    it('runs validation automatically when fileData is present', async () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      setupStoreWithValidData(store)

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      await waitFor(() => {
        expect(screen.getByTestId('validation-summary')).toBeInTheDocument()
      })

      expect(screen.getByTestId('validation-summary').textContent).toContain(
        '2 de 2 linhas válidas',
      )
      expect(screen.getByTestId('next-button')).not.toBeDisabled()
    })

    it('detects validation errors on mount', async () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      setupStoreWithInvalidData(store)

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      await waitFor(() => {
        expect(screen.getByTestId('validation-summary')).toBeInTheDocument()
      })

      // Should have errors (row 2 missing origin, row 3 missing destination)
      expect(screen.getByTestId('next-button')).toBeDisabled()
      expect(screen.getByTestId('validation-summary').textContent).toContain('erro')
    })

    it('does not re-run validation if result already in store', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      setupStoreWithValidData(store)
      store.getState().setValidationResult({
        isValid: true,
        totalRows: 2,
        validRows: 2,
        issues: [],
        errorCount: 0,
        warningCount: 0,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      // Should show existing result immediately, no loading
      expect(screen.getByTestId('validation-summary')).toBeInTheDocument()
      expect(screen.queryByTestId('validation-progress')).not.toBeInTheDocument()
    })
  })

  describe('missing fileData', () => {
    it('shows fallback message when fileData is null', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      // No fileData set

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      expect(
        screen.getByText(/Dados do arquivo não disponíveis/),
      ).toBeInTheDocument()
    })

    it('disables Revalidar when fileData is null', () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      expect(screen.getByText('Revalidar')).toBeDisabled()
    })
  })

  describe('revalidation', () => {
    it('re-runs validation when Revalidar is clicked', async () => {
      const user = userEvent.setup()
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      setupStoreWithValidData(store)
      store.getState().setValidationResult({
        isValid: true,
        totalRows: 2,
        validRows: 2,
        issues: [],
        errorCount: 0,
        warningCount: 0,
      })

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      // Summary is showing
      expect(screen.getByTestId('validation-summary')).toBeInTheDocument()

      // Click revalidate
      await user.click(screen.getByText('Revalidar'))

      // Should eventually show new result
      await waitFor(() => {
        expect(screen.getByTestId('validation-summary')).toBeInTheDocument()
      })
    })

    it('stores validation result in store after validation', async () => {
      const store = createImporterStore({
        sessionKey: 'test',
        storage: createMemoryStorage(),
      })
      setupStoreWithValidData(store)

      renderWithStore(
        <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
        { store },
      )

      await waitFor(() => {
        expect(screen.getByTestId('validation-summary')).toBeInTheDocument()
      })

      // Store should have the validation result
      const result = store.getState().validationResult
      expect(result).not.toBeNull()
      expect(result!.isValid).toBe(true)
      expect(result!.totalRows).toBe(2)
    })
  })
})
