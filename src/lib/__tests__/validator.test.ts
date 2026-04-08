import { describe, it, expect } from 'vitest'
import { coerceToNumber, coerceToDate, coerceToBoolean } from '../type-coercion'
import { validateCell, validateRows, buildValidationResult } from '../validator'
import type { TargetColumn, ColumnMapping } from '@/types/column'

// ── Type Coercion ──

describe('coerceToNumber', () => {
  it('parses standard numbers', () => {
    expect(coerceToNumber('42')).toBe(42)
    expect(coerceToNumber('3.14')).toBe(3.14)
    expect(coerceToNumber('-10')).toBe(-10)
  })

  it('parses pt-BR format with comma decimal', () => {
    expect(coerceToNumber('1.234,56')).toBe(1234.56)
    expect(coerceToNumber('99,9')).toBe(99.9)
  })

  it('passes through numbers', () => {
    expect(coerceToNumber(42)).toBe(42)
  })

  it('returns null for invalid values', () => {
    expect(coerceToNumber('')).toBeNull()
    expect(coerceToNumber(null)).toBeNull()
    expect(coerceToNumber(undefined)).toBeNull()
    expect(coerceToNumber('abc')).toBeNull()
    expect(coerceToNumber(NaN)).toBeNull()
  })
})

describe('coerceToDate', () => {
  it('parses DD/MM/YYYY', () => {
    const d = coerceToDate('25/12/2024')!
    expect(d.getDate()).toBe(25)
    expect(d.getMonth()).toBe(11) // December = 11
    expect(d.getFullYear()).toBe(2024)
  })

  it('parses YYYY-MM-DD', () => {
    const d = coerceToDate('2024-01-15')!
    expect(d.getDate()).toBe(15)
    expect(d.getMonth()).toBe(0)
    expect(d.getFullYear()).toBe(2024)
  })

  it('parses DD/MM/YYYY HH:mm', () => {
    const d = coerceToDate('01/06/2025 14:30')!
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(30)
  })

  it('parses DD-MM-YYYY', () => {
    const d = coerceToDate('01-06-2025')!
    expect(d.getDate()).toBe(1)
    expect(d.getMonth()).toBe(5)
  })

  it('passes through Date objects', () => {
    const original = new Date(2024, 0, 1)
    expect(coerceToDate(original)).toBe(original)
  })

  it('returns null for invalid values', () => {
    expect(coerceToDate('')).toBeNull()
    expect(coerceToDate(null)).toBeNull()
    expect(coerceToDate('not a date')).toBeNull()
  })
})

describe('coerceToBoolean', () => {
  it('recognizes true values', () => {
    expect(coerceToBoolean('sim')).toBe(true)
    expect(coerceToBoolean('yes')).toBe(true)
    expect(coerceToBoolean('true')).toBe(true)
    expect(coerceToBoolean('1')).toBe(true)
    expect(coerceToBoolean('S')).toBe(true)
    expect(coerceToBoolean('Verdadeiro')).toBe(true)
  })

  it('recognizes false values', () => {
    expect(coerceToBoolean('não')).toBe(false)
    expect(coerceToBoolean('nao')).toBe(false)
    expect(coerceToBoolean('no')).toBe(false)
    expect(coerceToBoolean('false')).toBe(false)
    expect(coerceToBoolean('0')).toBe(false)
    expect(coerceToBoolean('N')).toBe(false)
    expect(coerceToBoolean('Falso')).toBe(false)
  })

  it('passes through booleans', () => {
    expect(coerceToBoolean(true)).toBe(true)
    expect(coerceToBoolean(false)).toBe(false)
  })

  it('returns null for invalid values', () => {
    expect(coerceToBoolean('')).toBeNull()
    expect(coerceToBoolean(null)).toBeNull()
    expect(coerceToBoolean('maybe')).toBeNull()
  })
})

// ── Validators ──

describe('validateCell', () => {
  it('errors on empty required field', () => {
    const col: TargetColumn = {
      key: 'name',
      label: 'Nome',
      required: true,
      type: 'string',
    }
    const issues = validateCell('', col, 1)
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('error')
    expect(issues[0].message).toContain('obrigatório')
  })

  it('allows empty optional field', () => {
    const col: TargetColumn = {
      key: 'name',
      label: 'Nome',
      required: false,
      type: 'string',
    }
    expect(validateCell('', col, 1)).toHaveLength(0)
  })

  it('validates number type', () => {
    const col: TargetColumn = {
      key: 'age',
      label: 'Idade',
      required: true,
      type: 'number',
    }
    expect(validateCell('25', col, 1)).toHaveLength(0)
    expect(validateCell('abc', col, 1)).toHaveLength(1)
  })

  it('validates date type', () => {
    const col: TargetColumn = {
      key: 'date',
      label: 'Data',
      required: true,
      type: 'date',
    }
    expect(validateCell('01/01/2025', col, 1)).toHaveLength(0)
    expect(validateCell('invalid', col, 1)).toHaveLength(1)
  })

  it('validates boolean type', () => {
    const col: TargetColumn = {
      key: 'active',
      label: 'Ativo',
      required: true,
      type: 'boolean',
    }
    expect(validateCell('sim', col, 1)).toHaveLength(0)
    expect(validateCell('maybe', col, 1)).toHaveLength(1)
  })

  it('validates email type', () => {
    const col: TargetColumn = {
      key: 'email',
      label: 'Email',
      required: true,
      type: 'email',
    }
    expect(validateCell('test@example.com', col, 1)).toHaveLength(0)
    expect(validateCell('not-an-email', col, 1)).toHaveLength(1)
  })

  it('validates enum type', () => {
    const col: TargetColumn = {
      key: 'status',
      label: 'Status',
      required: true,
      type: 'enum',
      enumValues: ['ativo', 'inativo'],
    }
    expect(validateCell('ativo', col, 1)).toHaveLength(0)
    expect(validateCell('pendente', col, 1)).toHaveLength(1)
  })

  it('validates regex validator', () => {
    const col: TargetColumn = {
      key: 'code',
      label: 'Código',
      required: true,
      type: 'string',
      validators: [
        { type: 'regex', value: '^[A-Z]{3}$', message: 'Deve ter 3 letras maiúsculas' },
      ],
    }
    expect(validateCell('ABC', col, 1)).toHaveLength(0)
    expect(validateCell('abc', col, 1)).toHaveLength(1)
  })

  it('validates min/max validators', () => {
    const col: TargetColumn = {
      key: 'age',
      label: 'Idade',
      required: true,
      type: 'number',
      validators: [
        { type: 'min', value: 0, message: 'Mínimo 0' },
        { type: 'max', value: 150, message: 'Máximo 150' },
      ],
    }
    expect(validateCell('25', col, 1)).toHaveLength(0)
    expect(validateCell('-1', col, 1)).toHaveLength(1)
    expect(validateCell('200', col, 1)).toHaveLength(1)
  })

  it('validates minLength/maxLength validators', () => {
    const col: TargetColumn = {
      key: 'name',
      label: 'Nome',
      required: true,
      type: 'string',
      validators: [
        { type: 'minLength', value: 2, message: 'Min 2 chars' },
        { type: 'maxLength', value: 50, message: 'Max 50 chars' },
      ],
    }
    expect(validateCell('AB', col, 1)).toHaveLength(0)
    expect(validateCell('A', col, 1)).toHaveLength(1)
  })

  it('validates custom validator', () => {
    const col: TargetColumn = {
      key: 'even',
      label: 'Par',
      required: true,
      type: 'number',
      validators: [
        {
          type: 'custom',
          validate: (v) => Number(v) % 2 === 0,
          message: 'Deve ser par',
        },
      ],
    }
    expect(validateCell('4', col, 1)).toHaveLength(0)
    expect(validateCell('3', col, 1)).toHaveLength(1)
  })

  it('validates enum validator (via validators array)', () => {
    const col: TargetColumn = {
      key: 'size',
      label: 'Tamanho',
      required: true,
      type: 'string',
      validators: [
        { type: 'enum', value: ['P', 'M', 'G'], message: 'Tamanho inválido' },
      ],
    }
    expect(validateCell('M', col, 1)).toHaveLength(0)
    expect(validateCell('XL', col, 1)).toHaveLength(1)
  })
})

describe('validateRows', () => {
  it('validates all rows against all mapped columns', () => {
    const columns: TargetColumn[] = [
      { key: 'name', label: 'Nome', required: true, type: 'string' },
      { key: 'age', label: 'Idade', required: true, type: 'number' },
    ]
    const mappings: ColumnMapping[] = [
      { targetKey: 'name', sourceIndex: 0 },
      { targetKey: 'age', sourceIndex: 1 },
    ]
    const rows = [
      ['Alice', '30'],
      ['', 'abc'], // both errors
      ['Bob', '25'],
    ]

    const issues = validateRows(rows, columns, mappings, 0)

    // Row 2: name required + age not number = 2 issues
    expect(issues).toHaveLength(2)
    expect(issues[0].row).toBe(2) // 1-based
    expect(issues[1].row).toBe(2)
  })
})

describe('buildValidationResult', () => {
  it('builds correct result from issues', () => {
    const issues = [
      { row: 1, columnKey: 'a', severity: 'error' as const, message: '', value: '' },
      { row: 1, columnKey: 'b', severity: 'error' as const, message: '', value: '' },
      { row: 3, columnKey: 'a', severity: 'warning' as const, message: '', value: '' },
    ]

    const result = buildValidationResult(issues, 10)

    expect(result.isValid).toBe(false)
    expect(result.totalRows).toBe(10)
    expect(result.validRows).toBe(9) // only row 1 has errors
    expect(result.errorCount).toBe(2)
    expect(result.warningCount).toBe(1)
  })

  it('marks as valid when no errors', () => {
    const result = buildValidationResult([], 5)
    expect(result.isValid).toBe(true)
    expect(result.validRows).toBe(5)
    expect(result.errorCount).toBe(0)
  })
})
