import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import * as XLSX from 'xlsx'
import { useValidator } from '../use-validator'
import type { TargetColumn, ColumnMapping } from '@/types/column'

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

const columns: TargetColumn[] = [
  { key: 'name', label: 'Nome', required: true, type: 'string' },
  { key: 'age', label: 'Idade', required: true, type: 'number' },
]

const mappings: ColumnMapping[] = [
  { targetKey: 'name', sourceIndex: 0 },
  { targetKey: 'age', sourceIndex: 1 },
]

describe('useValidator', () => {
  it('starts with default state', () => {
    const { result } = renderHook(() => useValidator())

    expect(result.current.isValidating).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.result).toBeNull()
  })

  it('validates valid data successfully', async () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade'],
      [
        ['Alice', 30],
        ['Bob', 25],
      ],
    )

    const { result } = renderHook(() => useValidator())

    let validationResult: Awaited<ReturnType<typeof result.current.validate>>

    await act(async () => {
      validationResult = await result.current.validate(buffer, columns, mappings)
    })

    expect(validationResult!.isValid).toBe(true)
    expect(validationResult!.totalRows).toBe(2)
    expect(validationResult!.validRows).toBe(2)
    expect(validationResult!.errorCount).toBe(0)

    expect(result.current.isValidating).toBe(false)
    expect(result.current.progress).toBe(100)
    expect(result.current.result).toEqual(validationResult!)
  })

  it('detects validation errors', async () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade'],
      [
        ['Alice', 30],
        ['', 'abc'], // name required + age not number
        ['Bob', 25],
      ],
    )

    const { result } = renderHook(() => useValidator())

    let validationResult: Awaited<ReturnType<typeof result.current.validate>>

    await act(async () => {
      validationResult = await result.current.validate(buffer, columns, mappings)
    })

    expect(validationResult!.isValid).toBe(false)
    expect(validationResult!.errorCount).toBeGreaterThan(0)
    expect(validationResult!.issues.length).toBeGreaterThan(0)

    // Row 2 should have errors
    const row2Issues = validationResult!.issues.filter((i) => i.row === 2)
    expect(row2Issues.length).toBeGreaterThan(0)
  })

  it('updates progress during validation', async () => {
    const data = Array.from({ length: 20 }, (_, i) => [
      `Person ${i}`,
      i + 18,
    ])
    const buffer = createXlsxBuffer(['Nome', 'Idade'], data)

    const { result } = renderHook(() => useValidator())

    await act(async () => {
      await result.current.validate(buffer, columns, mappings)
    })

    // After completion, progress should be 100
    expect(result.current.progress).toBe(100)
    expect(result.current.isValidating).toBe(false)
  })

  it('resets state when validate is called again', async () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade'],
      [['Alice', 30]],
    )

    const { result } = renderHook(() => useValidator())

    // First validation
    await act(async () => {
      await result.current.validate(buffer, columns, mappings)
    })

    expect(result.current.result).not.toBeNull()

    // Second validation - should reset first
    const bufferWithError = createXlsxBuffer(
      ['Nome', 'Idade'],
      [['', 'abc']],
    )

    await act(async () => {
      await result.current.validate(bufferWithError, columns, mappings)
    })

    expect(result.current.result!.isValid).toBe(false)
  })

  it('does not get stuck on validation errors', async () => {
    const buffer = createXlsxBuffer(
      ['Nome', 'Idade'],
      [
        ['', ''],
        ['', ''],
        ['', ''],
      ],
    )

    const { result } = renderHook(() => useValidator())

    await act(async () => {
      await result.current.validate(buffer, columns, mappings)
    })

    // Should complete even with many errors
    expect(result.current.isValidating).toBe(false)
    expect(result.current.result).not.toBeNull()
    expect(result.current.result!.errorCount).toBeGreaterThan(0)
  })
})
