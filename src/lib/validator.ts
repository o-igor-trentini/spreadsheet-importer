import type { TargetColumn, ColumnMapping } from '@/types/column'
import type { ValidationIssue, ValidationResult } from '@/types/validation'
import { coerceToNumber, coerceToDate, coerceToBoolean } from './type-coercion'

export function validateCell(
  value: unknown,
  column: TargetColumn,
  row: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const strVal = value === null || value === undefined ? '' : String(value).trim()
  const isEmpty = strVal === ''

  // Required check
  if (column.required && isEmpty) {
    issues.push({
      row,
      columnKey: column.key,
      severity: 'error',
      message: `"${column.label}" é obrigatório.`,
      value,
    })
    return issues // skip other validators if empty & required
  }

  // Skip further validation for empty optional fields
  if (isEmpty) return issues

  // Type check with coercion
  switch (column.type) {
    case 'number': {
      const num = coerceToNumber(value)
      if (num === null) {
        issues.push({
          row,
          columnKey: column.key,
          severity: 'error',
          message: `"${column.label}" deve ser um número.`,
          value,
        })
        return issues
      }
      break
    }
    case 'date': {
      const date = coerceToDate(value)
      if (date === null) {
        issues.push({
          row,
          columnKey: column.key,
          severity: 'error',
          message: `"${column.label}" deve ser uma data válida.`,
          value,
        })
        return issues
      }
      break
    }
    case 'boolean': {
      const bool = coerceToBoolean(value)
      if (bool === null) {
        issues.push({
          row,
          columnKey: column.key,
          severity: 'error',
          message: `"${column.label}" deve ser verdadeiro ou falso.`,
          value,
        })
        return issues
      }
      break
    }
    case 'email': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        issues.push({
          row,
          columnKey: column.key,
          severity: 'error',
          message: `"${column.label}" deve ser um email válido.`,
          value,
        })
        return issues
      }
      break
    }
    case 'enum': {
      if (
        column.enumValues &&
        !column.enumValues.includes(strVal)
      ) {
        issues.push({
          row,
          columnKey: column.key,
          severity: 'error',
          message: `"${column.label}" deve ser um dos valores: ${column.enumValues.join(', ')}.`,
          value,
        })
        return issues
      }
      break
    }
  }

  // Custom validators
  if (column.validators) {
    for (const validator of column.validators) {
      const msg = validator.message ?? `Validação falhou para "${column.label}".`

      switch (validator.type) {
        case 'required':
          if (isEmpty) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        case 'regex':
          if (typeof validator.value === 'string' && !new RegExp(validator.value).test(strVal)) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        case 'min': {
          const num = coerceToNumber(value)
          if (num !== null && typeof validator.value === 'number' && num < validator.value) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        }
        case 'max': {
          const num = coerceToNumber(value)
          if (num !== null && typeof validator.value === 'number' && num > validator.value) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        }
        case 'minLength':
          if (typeof validator.value === 'number' && strVal.length < validator.value) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        case 'maxLength':
          if (typeof validator.value === 'number' && strVal.length > validator.value) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        case 'enum':
          if (
            Array.isArray(validator.value) &&
            !validator.value.includes(strVal)
          ) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
        case 'custom':
          if (validator.validate && !validator.validate(value)) {
            issues.push({ row, columnKey: column.key, severity: 'error', message: msg, value })
          }
          break
      }
    }
  }

  return issues
}

export function validateRows(
  rows: string[][],
  columns: TargetColumn[],
  mappings: ColumnMapping[],
  startRow: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Build mapping lookup: targetKey → index in the row array
  const mappingIndex = new Map<string, number>()
  mappings.forEach((m, i) => {
    mappingIndex.set(m.targetKey, i)
  })

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const rowNumber = startRow + r + 1 // 1-based row number

    for (const column of columns) {
      const idx = mappingIndex.get(column.key)
      const value = idx !== undefined ? (row[idx] ?? '') : ''
      const cellIssues = validateCell(value, column, rowNumber)
      issues.push(...cellIssues)
    }
  }

  return issues
}

export function buildValidationResult(
  issues: ValidationIssue[],
  totalRows: number,
): ValidationResult {
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  // Count unique rows with errors
  const rowsWithErrors = new Set(
    issues.filter((i) => i.severity === 'error').map((i) => i.row),
  )
  const validRows = totalRows - rowsWithErrors.size

  return {
    isValid: errorCount === 0,
    totalRows,
    validRows,
    issues,
    errorCount,
    warningCount,
  }
}
