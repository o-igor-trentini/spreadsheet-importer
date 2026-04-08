import type { ColumnMapping, SourceColumn } from './column'
import type { ImporterStep } from './importer'
import type { ValidationResult } from './validation'

export interface ImporterState {
  step: ImporterStep
  fileName: string | null
  fileData: ArrayBuffer | null
  sourceColumns: SourceColumn[]
  previewData: string[][]
  totalRows: number
  mappings: ColumnMapping[]
  validationResult: ValidationResult | null
  isProcessing: boolean
  error: string | null
}

export interface ImporterActions {
  setStep: (step: ImporterStep) => void
  setFileData: (data: {
    fileName: string
    fileData: ArrayBuffer
    sourceColumns: SourceColumn[]
    previewData: string[][]
    totalRows: number
  }) => void
  setMappings: (mappings: ColumnMapping[]) => void
  setValidationResult: (result: ValidationResult | null) => void
  setProcessing: (isProcessing: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type ImporterStore = ImporterState & ImporterActions
