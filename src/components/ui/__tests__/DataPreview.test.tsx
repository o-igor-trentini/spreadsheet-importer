import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataPreview } from '../DataPreview'
import type { SourceColumn } from '@/types/column'

const sourceColumns: SourceColumn[] = [
  { index: 0, header: 'Origem', sampleValues: ['SP', 'RJ'] },
  { index: 1, header: 'Destino', sampleValues: ['BA', 'MG'] },
  { index: 2, header: 'Data', sampleValues: ['01/01/2025'] },
]

const previewData = [
  ['São Paulo', 'Salvador', '01/01/2025'],
  ['Rio de Janeiro', 'Belo Horizonte', '02/01/2025'],
  ['Curitiba', 'Florianópolis', '03/01/2025'],
]

describe('DataPreview', () => {
  it('renders nothing when sourceColumns is empty', () => {
    const { container } = render(
      <DataPreview sourceColumns={[]} previewData={[]} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders all column headers', () => {
    render(
      <DataPreview sourceColumns={sourceColumns} previewData={previewData} />,
    )

    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(screen.getByText('Data')).toBeInTheDocument()
  })

  it('renders all data rows', () => {
    render(
      <DataPreview sourceColumns={sourceColumns} previewData={previewData} />,
    )

    expect(screen.getByText('São Paulo')).toBeInTheDocument()
    expect(screen.getByText('Salvador')).toBeInTheDocument()
    expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument()
    expect(screen.getByText('Belo Horizonte')).toBeInTheDocument()
    expect(screen.getByText('Curitiba')).toBeInTheDocument()
  })

  it('renders using a simple table (no absolute positioning)', () => {
    const { container } = render(
      <DataPreview sourceColumns={sourceColumns} previewData={previewData} />,
    )

    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()

    // No absolute positioned rows
    const tbody = table!.querySelector('tbody')
    expect(tbody).toBeInTheDocument()
    expect(tbody!.style.position).not.toBe('relative')

    const rows = tbody!.querySelectorAll('tr')
    expect(rows).toHaveLength(3)
    rows.forEach((row) => {
      expect(row.style.position).not.toBe('absolute')
    })
  })

  it('header cells have sticky class for scroll behavior', () => {
    const { container } = render(
      <DataPreview sourceColumns={sourceColumns} previewData={previewData} />,
    )

    const thead = container.querySelector('thead')
    expect(thead).toBeInTheDocument()
    expect(thead!.className).toContain('sticky')
  })

  it('data cells have truncate class', () => {
    const { container } = render(
      <DataPreview sourceColumns={sourceColumns} previewData={previewData} />,
    )

    const tds = container.querySelectorAll('td')
    expect(tds.length).toBeGreaterThan(0)
    tds.forEach((td) => {
      expect(td.className).toContain('truncate')
    })
  })

  it('handles missing cell values gracefully', () => {
    const sparseData = [
      ['São Paulo', '', '01/01/2025'],
      ['', 'Salvador', ''],
    ]

    render(
      <DataPreview sourceColumns={sourceColumns} previewData={sparseData} />,
    )

    expect(screen.getByText('São Paulo')).toBeInTheDocument()
    expect(screen.getByText('Salvador')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DataPreview
        sourceColumns={sourceColumns}
        previewData={previewData}
        className="my-custom-class"
      />,
    )

    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
