import * as XLSX from 'xlsx'
import type { SourceColumn } from '@/types/column'
import type { ColumnMapping } from '@/types/column'
import type { SheetInfo } from '@/types/worker'

export interface ParsePreviewResult {
  sheets: SheetInfo[]
  sourceColumns: SourceColumn[]
  previewData: string[][]
  totalRows: number
}

export function parsePreview(
  data: ArrayBuffer,
  previewRowCount: number,
): ParsePreviewResult {
  const workbook = XLSX.read(data, { type: 'array' })

  if (workbook.SheetNames.length === 0) {
    throw new Error('O arquivo não contém nenhuma planilha.')
  }

  const sheets: SheetInfo[] = workbook.SheetNames.map((name, index) => ({
    name,
    index,
  }))

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1')

  const totalRows = Math.max(0, range.e.r) // row 0 is header
  const colCount = range.e.c + 1

  const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
    range: 0,
  })

  const headerRow = allRows[0] ?? []
  const dataRows = allRows.slice(1)

  const previewData = dataRows.slice(0, previewRowCount)

  const sourceColumns: SourceColumn[] = []
  for (let c = 0; c < colCount; c++) {
    const header = String(headerRow[c] ?? `Coluna ${c + 1}`).trim()
    const sampleValues: string[] = []

    for (let r = 0; r < Math.min(previewRowCount, dataRows.length); r++) {
      const val = dataRows[r]?.[c]
      if (val !== undefined && val !== '') {
        sampleValues.push(String(val))
      }
    }

    sourceColumns.push({ index: c, header, sampleValues })
  }

  return { sheets, sourceColumns, previewData, totalRows }
}

export interface ExtractDataResult {
  rows: string[][]
  startRow: number
  totalRows: number
}

export function* extractDataChunks(
  data: ArrayBuffer,
  mappings: ColumnMapping[],
  chunkSize: number,
): Generator<ExtractDataResult> {
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
    range: 0,
  })

  const dataRows = allRows.slice(1) // skip header
  const totalRows = dataRows.length
  const sourceIndices = mappings.map((m) => m.sourceIndex)

  for (let i = 0; i < totalRows; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize)
    const mapped = chunk.map((row) =>
      sourceIndices.map((idx) => String(row[idx] ?? '')),
    )
    yield { rows: mapped, startRow: i, totalRows }
  }
}
