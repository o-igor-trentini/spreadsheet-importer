import { validateRows } from '@/lib/validator'
import type { TargetColumn, ColumnMapping } from '@/types/column'
import type { ValidationIssue } from '@/types/validation'

export interface ValidateChunkRequest {
  type: 'validate-chunk'
  rows: string[][]
  columns: TargetColumn[]
  mappings: ColumnMapping[]
  startRow: number
  totalRows: number
}

export interface ValidateChunkResponse {
  type: 'validate-chunk-result'
  issues: ValidationIssue[]
  startRow: number
  processedRows: number
  totalRows: number
}

export interface ValidateErrorResponse {
  type: 'error'
  message: string
}

export type ValidatorWorkerRequest = ValidateChunkRequest

export type ValidatorWorkerResponse =
  | ValidateChunkResponse
  | ValidateErrorResponse

self.onmessage = (event: MessageEvent<ValidatorWorkerRequest>) => {
  const request = event.data

  try {
    if (request.type === 'validate-chunk') {
      // Strip non-serializable fields (validate functions) - they can't cross worker boundary
      // The main thread handles custom validators separately
      const issues = validateRows(
        request.rows,
        request.columns,
        request.mappings,
        request.startRow,
      )

      const response: ValidateChunkResponse = {
        type: 'validate-chunk-result',
        issues,
        startRow: request.startRow,
        processedRows: request.rows.length,
        totalRows: request.totalRows,
      }
      self.postMessage(response)
    }
  } catch (error) {
    const response: ValidateErrorResponse = {
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido durante validação.',
    }
    self.postMessage(response)
  }
}
