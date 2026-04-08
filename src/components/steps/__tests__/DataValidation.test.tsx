import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataValidation } from '../DataValidation'
import {
  createImporterStore,
  type ImporterStoreApi,
} from '@/store/importer-store'
import { ImporterStoreContext } from '@/store/store-provider'
import type { TargetColumn } from '@/types/column'
import type { ValidationResult } from '@/types/validation'
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

describe('DataValidation', () => {
  it('shows validation summary when result exists', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })

    const validResult: ValidationResult = {
      isValid: true,
      totalRows: 10,
      validRows: 10,
      issues: [],
      errorCount: 0,
      warningCount: 0,
    }
    store.getState().setValidationResult(validResult)

    renderWithStore(
      <DataValidation
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    const summary = screen.getByTestId('validation-summary')
    expect(summary).toBeInTheDocument()
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
        {
          row: 1,
          columnKey: 'origin',
          severity: 'error',
          message: 'obrigatório',
          value: '',
        },
      ],
      errorCount: 5,
      warningCount: 2,
    })

    renderWithStore(
      <DataValidation
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
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
      issues: [
        {
          row: 1,
          columnKey: 'origin',
          severity: 'error',
          message: 'err',
          value: '',
        },
      ],
      errorCount: 2,
      warningCount: 0,
    })

    renderWithStore(
      <DataValidation
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
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
      <DataValidation
        columns={targetColumns}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
      { store },
    )

    expect(screen.getByTestId('next-button')).not.toBeDisabled()
  })

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

  it('shows Revalidar button', () => {
    const store = createImporterStore({
      sessionKey: 'test',
      storage: createMemoryStorage(),
    })

    renderWithStore(
      <DataValidation columns={targetColumns} onNext={vi.fn()} onBack={vi.fn()} />,
      { store },
    )

    expect(screen.getByText('Revalidar')).toBeInTheDocument()
  })
})
