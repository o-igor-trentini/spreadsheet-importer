import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColumnMapping } from '../ColumnMapping'
import {
  createImporterStore,
  type ImporterStoreApi,
} from '@/store/importer-store'
import { ImporterStoreContext } from '@/store/store-provider'
import type { TargetColumn, SourceColumn } from '@/types/column'
import type { ReactNode } from 'react'
import type { StateStorage } from 'zustand/middleware'

const targetColumns: TargetColumn[] = [
  { key: 'origin', label: 'Origem', required: true, type: 'string' },
  { key: 'destination', label: 'Destino', required: true, type: 'string' },
  { key: 'driver', label: 'Motorista', required: false, type: 'string' },
]

const sourceColumns: SourceColumn[] = [
  { index: 0, header: 'Origem', sampleValues: ['São Paulo', 'Curitiba'] },
  { index: 1, header: 'Destino', sampleValues: ['Rio', 'Floripa'] },
  { index: 2, header: 'Motorista', sampleValues: ['João', 'Maria'] },
  { index: 3, header: 'Data', sampleValues: ['01/01/2025'] },
]

const previewData = [
  ['São Paulo', 'Rio', 'João', '01/01/2025'],
  ['Curitiba', 'Floripa', 'Maria', '02/01/2025'],
]

function createMemoryStorage(): StateStorage {
  const data = new Map<string, string>()
  return {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => data.set(name, value),
    removeItem: (name) => data.delete(name),
  }
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

function setupStore(store: ImporterStoreApi) {
  store.getState().setFileData({
    fileName: 'test.xlsx',
    fileData: new ArrayBuffer(8),
    sourceColumns,
    previewData,
    totalRows: 2,
  })
}

describe('ColumnMapping', () => {
  it('renders all target columns', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    expect(screen.getByTestId('mapping-row-origin')).toBeInTheDocument()
    expect(screen.getByTestId('mapping-row-destination')).toBeInTheDocument()
    expect(screen.getByTestId('mapping-row-driver')).toBeInTheDocument()
  })

  it('shows required and optional badges', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    const originRow = screen.getByTestId('mapping-row-origin')
    expect(within(originRow).getByText('obrigatório')).toBeInTheDocument()

    const driverRow = screen.getByTestId('mapping-row-driver')
    expect(within(driverRow).getByText('opcional')).toBeInTheDocument()
  })

  it('auto-maps columns on mount', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    // After auto-mapping, the store should have mappings
    const mappings = store.getState().mappings
    expect(mappings.length).toBeGreaterThan(0)

    // Origin should map to source column 0 (exact match "Origem")
    const originMapping = mappings.find((m) => m.targetKey === 'origin')
    expect(originMapping).toBeDefined()
    expect(originMapping!.sourceIndex).toBe(0)
  })

  it('does not auto-map if mappings already exist', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    const existingMappings = [{ targetKey: 'origin', sourceIndex: 3 }]
    store.getState().setMappings(existingMappings)

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    // Should keep the existing mapping, not replace it
    const mappings = store.getState().mappings
    expect(mappings).toEqual(existingMappings)
  })

  it('disables Next button when required columns are not mapped', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    // Set mappings with only one required column
    store.getState().setMappings([{ targetKey: 'origin', sourceIndex: 0 }])

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    const nextButton = screen.getByTestId('next-button')
    expect(nextButton).toBeDisabled()
  })

  it('enables Next button when all required columns are mapped', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    // Map both required columns
    store.getState().setMappings([
      { targetKey: 'origin', sourceIndex: 0 },
      { targetKey: 'destination', sourceIndex: 1 },
    ])

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    const nextButton = screen.getByTestId('next-button')
    expect(nextButton).not.toBeDisabled()
  })

  it('calls onNext when Next button is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    // Map all required columns
    store.getState().setMappings([
      { targetKey: 'origin', sourceIndex: 0 },
      { targetKey: 'destination', sourceIndex: 1 },
    ])

    renderWithStore(
      <ColumnMapping columns={targetColumns} onNext={onNext} onBack={vi.fn()} />,
      { store },
    )

    await user.click(screen.getByTestId('next-button'))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('calls onBack when Voltar button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    renderWithStore(
      <ColumnMapping columns={targetColumns} onNext={vi.fn()} onBack={onBack} />,
      { store },
    )

    await user.click(screen.getByText('Voltar'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('renders DataPreview with source data', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })
    setupStore(store)

    renderWithStore(
      <ColumnMapping
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    // Check that source column headers are visible in the preview table
    expect(screen.getByText('Data')).toBeInTheDocument()
  })
})
