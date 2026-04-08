export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  row: number
  columnKey: string
  severity: ValidationSeverity
  message: string
  value: unknown
}

export interface ValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
}
