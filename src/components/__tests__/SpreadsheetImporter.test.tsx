import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpreadsheetImporter } from '../SpreadsheetImporter'
import type { TargetColumn } from '@/types/column'

const columns: TargetColumn[] = [
  { key: 'origin', label: 'Origem', required: true, type: 'string' },
  { key: 'destination', label: 'Destino', required: true, type: 'string' },
  { key: 'date', label: 'Data', required: true, type: 'date' },
  { key: 'driver', label: 'Motorista', required: false, type: 'string' },
]

describe('SpreadsheetImporter', () => {
  it('renders without crash', () => {
    render(
      <SpreadsheetImporter columns={columns} onComplete={vi.fn()} />,
    )

    expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('dropzone')).toBeInTheDocument()
  })

  it('starts at upload step', () => {
    render(
      <SpreadsheetImporter columns={columns} onComplete={vi.fn()} />,
    )

    const uploadStep = screen.getByTestId('step-upload')
    expect(uploadStep).toBeInTheDocument()
    // Upload step should be current (has primary background)
    expect(uploadStep.className).toContain('bg-primary')
  })

  it('shows upload UI on initial render', () => {
    render(
      <SpreadsheetImporter columns={columns} onComplete={vi.fn()} />,
    )

    expect(
      screen.getByText('Arraste sua planilha aqui ou clique para selecionar'),
    ).toBeInTheDocument()
  })

  it('shows all step labels in the indicator', () => {
    render(
      <SpreadsheetImporter columns={columns} onComplete={vi.fn()} />,
    )

    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Mapeamento')).toBeInTheDocument()
    expect(screen.getByText('Validação')).toBeInTheDocument()
    expect(screen.getByText('Revisão')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <SpreadsheetImporter
        columns={columns}
        onComplete={vi.fn()}
        className="custom-class"
      />,
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-class')
  })

  it('does not show resume banner on fresh start', () => {
    render(
      <SpreadsheetImporter columns={columns} onComplete={vi.fn()} />,
    )

    expect(screen.queryByTestId('resume-banner')).not.toBeInTheDocument()
  })
})
