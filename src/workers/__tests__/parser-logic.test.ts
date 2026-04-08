import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parsePreview, extractDataChunks } from '@/lib/parser-logic'

function createCsvBuffer(csv: string): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const rows = csv
    .trim()
    .split('\n')
    .map((line) => line.split(','))
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return out
}

function createXlsxBuffer(
  headers: string[],
  data: (string | number)[][],
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const rows = [headers, ...data]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Dados')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

function createMultiSheetBuffer(): ArrayBuffer {
  const workbook = XLSX.utils.book_new()

  const sheet1 = XLSX.utils.aoa_to_sheet([
    ['Nome', 'Idade'],
    ['Alice', '30'],
    ['Bob', '25'],
  ])
  XLSX.utils.book_append_sheet(workbook, sheet1, 'Pessoas')

  const sheet2 = XLSX.utils.aoa_to_sheet([
    ['Produto', 'Preço'],
    ['Widget', '9.99'],
  ])
  XLSX.utils.book_append_sheet(workbook, sheet2, 'Produtos')

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

describe('parsePreview', () => {
  it('extracts headers and sample values from CSV-like data', () => {
    const buffer = createCsvBuffer(
      'Origem,Destino,Data\nSão Paulo,Rio,01/01/2025\nCuritiba,Floripa,02/01/2025',
    )
    const result = parsePreview(buffer, 5)

    expect(result.sourceColumns).toHaveLength(3)
    expect(result.sourceColumns[0].header).toBe('Origem')
    expect(result.sourceColumns[0].index).toBe(0)
    expect(result.sourceColumns[0].sampleValues).toContain('São Paulo')
    expect(result.sourceColumns[1].header).toBe('Destino')
    expect(result.sourceColumns[2].header).toBe('Data')
  })

  it('extracts headers and sample values from XLSX', () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade', 'Email'],
      [
        ['Alice', 30, 'alice@test.com'],
        ['Bob', 25, 'bob@test.com'],
        ['Carol', 35, 'carol@test.com'],
      ],
    )
    const result = parsePreview(buffer, 10)

    expect(result.sourceColumns).toHaveLength(3)
    expect(result.sourceColumns[0].header).toBe('Nome')
    expect(result.sourceColumns[1].header).toBe('Idade')
    expect(result.sourceColumns[2].header).toBe('Email')

    expect(result.sourceColumns[0].sampleValues).toEqual([
      'Alice',
      'Bob',
      'Carol',
    ])
  })

  it('returns correct totalRows (excluding header)', () => {
    const buffer = createXlsxBuffer(
      ['A', 'B'],
      [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    )
    const result = parsePreview(buffer, 10)
    expect(result.totalRows).toBe(4)
  })

  it('limits preview data to previewRowCount', () => {
    const buffer = createXlsxBuffer(
      ['X'],
      Array.from({ length: 20 }, (_, i) => [String(i)]),
    )
    const result = parsePreview(buffer, 3)

    expect(result.previewData).toHaveLength(3)
    expect(result.totalRows).toBe(20)
  })

  it('returns sheets info', () => {
    const buffer = createMultiSheetBuffer()
    const result = parsePreview(buffer, 5)

    expect(result.sheets).toHaveLength(2)
    expect(result.sheets[0]).toEqual({ name: 'Pessoas', index: 0 })
    expect(result.sheets[1]).toEqual({ name: 'Produtos', index: 1 })
  })

  it('parses the first sheet by default', () => {
    const buffer = createMultiSheetBuffer()
    const result = parsePreview(buffer, 5)

    expect(result.sourceColumns[0].header).toBe('Nome')
    expect(result.sourceColumns[1].header).toBe('Idade')
  })

  it('handles empty values in sample data', () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Opcional'],
      [
        ['Alice', ''],
        ['Bob', 'valor'],
        ['Carol', ''],
      ],
    )
    const result = parsePreview(buffer, 10)

    expect(result.sourceColumns[1].sampleValues).toEqual(['valor'])
  })

  it('handles single-row file (header only, no data)', () => {
    const buffer = createXlsxBuffer(['A', 'B'], [])
    const result = parsePreview(buffer, 5)
    expect(result.totalRows).toBe(0)
    expect(result.previewData).toEqual([])
    expect(result.sourceColumns[0].sampleValues).toEqual([])
  })
})

describe('extractDataChunks', () => {
  it('extracts only mapped columns', () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade', 'Email'],
      [
        ['Alice', 30, 'alice@test.com'],
        ['Bob', 25, 'bob@test.com'],
      ],
    )

    const mappings = [
      { targetKey: 'name', sourceIndex: 0 },
      { targetKey: 'email', sourceIndex: 2 },
    ]

    const chunks = [...extractDataChunks(buffer, mappings, 5000)]
    expect(chunks).toHaveLength(1)
    expect(chunks[0].rows).toEqual([
      ['Alice', 'alice@test.com'],
      ['Bob', 'bob@test.com'],
    ])
  })

  it('sends data in chunks of specified size', () => {
    const data = Array.from({ length: 12 }, (_, i) => [
      `row${i}`,
      String(i),
    ])
    const buffer = createXlsxBuffer(['Col1', 'Col2'], data)

    const mappings = [{ targetKey: 'col1', sourceIndex: 0 }]
    const chunks = [...extractDataChunks(buffer, mappings, 5)]

    expect(chunks).toHaveLength(3) // 5 + 5 + 2
    expect(chunks[0].rows).toHaveLength(5)
    expect(chunks[0].startRow).toBe(0)
    expect(chunks[1].rows).toHaveLength(5)
    expect(chunks[1].startRow).toBe(5)
    expect(chunks[2].rows).toHaveLength(2)
    expect(chunks[2].startRow).toBe(10)
    expect(chunks[0].totalRows).toBe(12)
  })

  it('handles missing cell values as empty string', () => {
    const buffer = createXlsxBuffer(
      ['A', 'B', 'C'],
      [
        ['val', '', ''],
        ['', 'val', ''],
      ],
    )

    const mappings = [
      { targetKey: 'a', sourceIndex: 0 },
      { targetKey: 'c', sourceIndex: 2 },
    ]

    const chunks = [...extractDataChunks(buffer, mappings, 5000)]
    expect(chunks[0].rows).toEqual([
      ['val', ''],
      ['', ''],
    ])
  })
})
