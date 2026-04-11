import { describe, it, expect, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { parseFilePreview, extractAllData } from '../parser'

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

// In jsdom, Worker constructor throws — so we always test main thread fallback
describe('parseFilePreview (main thread fallback)', () => {
  it('parses headers and preview data', async () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade', 'Email'],
      [
        ['Alice', 30, 'alice@test.com'],
        ['Bob', 25, 'bob@test.com'],
        ['Carol', 35, 'carol@test.com'],
      ],
    )

    const result = await parseFilePreview(buffer, 10)

    expect(result.type).toBe('parse-preview-result')
    expect(result.sourceColumns).toHaveLength(3)
    expect(result.sourceColumns[0].header).toBe('Nome')
    expect(result.sourceColumns[1].header).toBe('Idade')
    expect(result.sourceColumns[2].header).toBe('Email')
    expect(result.totalRows).toBe(3)
    expect(result.previewData).toHaveLength(3)
  })

  it('limits preview rows', async () => {
    const data = Array.from({ length: 50 }, (_, i) => [`row${i}`])
    const buffer = createXlsxBuffer(['Col'], data)

    const result = await parseFilePreview(buffer, 5)

    expect(result.previewData).toHaveLength(5)
    expect(result.totalRows).toBe(50)
  })

  it('returns sheets info', async () => {
    const buffer = createXlsxBuffer(['A'], [['1']])
    const result = await parseFilePreview(buffer)

    expect(result.sheets).toHaveLength(1)
    expect(result.sheets[0].name).toBe('Sheet1')
  })
})

describe('extractAllData (main thread fallback)', () => {
  it('extracts mapped columns', async () => {
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

    const rows = await extractAllData(buffer, mappings)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual(['Alice', 'alice@test.com'])
    expect(rows[1]).toEqual(['Bob', 'bob@test.com'])
  })

  it('calls onChunk callback for each chunk', async () => {
    const data = Array.from({ length: 12 }, (_, i) => [String(i)])
    const buffer = createXlsxBuffer(['Val'], data)
    const mappings = [{ targetKey: 'val', sourceIndex: 0 }]

    const onChunk = vi.fn()
    await extractAllData(buffer, mappings, 5, onChunk)

    expect(onChunk).toHaveBeenCalledTimes(3) // 5 + 5 + 2
    expect(onChunk.mock.calls[0][1]).toBe(0) // startRow
    expect(onChunk.mock.calls[0][2]).toBe(12) // totalRows
    expect(onChunk.mock.calls[1][1]).toBe(5)
    expect(onChunk.mock.calls[2][1]).toBe(10)
  })

  it('is async and does not block the event loop', async () => {
    const data = Array.from({ length: 20 }, (_, i) => [String(i)])
    const buffer = createXlsxBuffer(['Val'], data)
    const mappings = [{ targetKey: 'val', sourceIndex: 0 }]

    const onChunk = vi.fn()
    const result = await extractAllData(buffer, mappings, 5, onChunk)

    // All chunks processed
    expect(onChunk).toHaveBeenCalledTimes(4) // 5+5+5+5
    expect(result).toHaveLength(20)

    // Verify the function returns a promise (is async)
    const promise = extractAllData(buffer, mappings, 5)
    expect(promise).toBeInstanceOf(Promise)
    await promise
  })

  it('handles empty data', async () => {
    const buffer = createXlsxBuffer(['A'], [])
    const mappings = [{ targetKey: 'a', sourceIndex: 0 }]

    const rows = await extractAllData(buffer, mappings)
    expect(rows).toEqual([])
  })
})
