import type { StateStorage } from 'zustand/middleware'
import type { TargetColumn } from './column'

export type ImporterStep = 'upload' | 'mapping' | 'validation' | 'review'

export type AllowedFormat = '.csv' | '.xlsx' | '.xls'

export interface SpreadsheetImporterProps {
  columns: TargetColumn[]
  onComplete: (data: Record<string, unknown>[]) => void
  onCancel?: () => void
  onStepChange?: (step: ImporterStep) => void
  sessionKey?: string
  maxFileSize?: number
  allowedFormats?: AllowedFormat[]
  maxRows?: number
  previewRowCount?: number
  locale?: string
  className?: string
  persistStorage?: StateStorage
}
