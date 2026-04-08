import type { ColumnMapping, SourceColumn } from './column'

export interface ParsePreviewRequest {
  type: 'parse-preview'
  data: ArrayBuffer
  previewRowCount: number
}

export interface ExtractDataRequest {
  type: 'extract-data'
  data: ArrayBuffer
  mappings: ColumnMapping[]
  chunkSize: number
}

export type WorkerRequest = ParsePreviewRequest | ExtractDataRequest

export interface SheetInfo {
  name: string
  index: number
}

export interface ParsePreviewResponse {
  type: 'parse-preview-result'
  sheets: SheetInfo[]
  sourceColumns: SourceColumn[]
  previewData: string[][]
  totalRows: number
}

export interface ExtractDataChunkResponse {
  type: 'extract-data-chunk'
  rows: string[][]
  startRow: number
  totalRows: number
}

export interface ExtractDataDoneResponse {
  type: 'extract-data-done'
  totalRows: number
}

export interface WorkerErrorResponse {
  type: 'error'
  message: string
}

export type WorkerResponse =
  | ParsePreviewResponse
  | ExtractDataChunkResponse
  | ExtractDataDoneResponse
  | WorkerErrorResponse
