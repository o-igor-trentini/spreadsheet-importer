import { useCallback, useState } from 'react'
import {
  validateRows,
  buildValidationResult,
} from '@/lib/validator'
import { extractAllData } from '@/lib/parser'
import type { TargetColumn, ColumnMapping } from '@/types/column'
import type { ValidationResult } from '@/types/validation'
import type { ValidationIssue } from '@/types/validation'

interface UseValidatorReturn {
  validate: (
    fileData: ArrayBuffer,
    columns: TargetColumn[],
    mappings: ColumnMapping[],
  ) => Promise<ValidationResult>
  isValidating: boolean
  progress: number
  result: ValidationResult | null
}

export function useValidator(): UseValidatorReturn {
  const [isValidating, setIsValidating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validate = useCallback(
    async (
      fileData: ArrayBuffer,
      columns: TargetColumn[],
      mappings: ColumnMapping[],
    ): Promise<ValidationResult> => {
      setIsValidating(true)
      setProgress(0)
      setResult(null)

      const allIssues: ValidationIssue[] = []
      let totalRows = 0

      try {
        await extractAllData(
          fileData,
          mappings,
          5000,
          (chunkRows, startRow, total) => {
            totalRows = total
            const chunkIssues = validateRows(
              chunkRows,
              columns,
              mappings,
              startRow,
            )
            allIssues.push(...chunkIssues)
            const pct = Math.min(
              100,
              Math.round(((startRow + chunkRows.length) / total) * 100),
            )
            setProgress(pct)
          },
        )

        const validationResult = buildValidationResult(allIssues, totalRows)
        setResult(validationResult)
        return validationResult
      } catch (err) {
        console.error('[spreadsheet-importer] Erro durante validação:', err)
        // Return empty result so UI doesn't get stuck
        const emptyResult = buildValidationResult(allIssues, totalRows)
        setResult(emptyResult)
        return emptyResult
      } finally {
        setIsValidating(false)
        setProgress(100)
      }
    },
    [],
  )

  return { validate, isValidating, progress, result }
}
