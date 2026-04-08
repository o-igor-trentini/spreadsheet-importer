import { describe, it, expect } from 'vitest'
import { autoMap, normalize } from '../auto-mapper'
import type { TargetColumn, SourceColumn } from '@/types/column'

function makeTarget(
  key: string,
  label: string,
  required = true,
): TargetColumn {
  return { key, label, required, type: 'string' }
}

function makeSource(index: number, header: string): SourceColumn {
  return { index, header, sampleValues: [] }
}

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  Hello World  ')).toBe('hello world')
  })

  it('removes diacritics', () => {
    expect(normalize('Código')).toBe('codigo')
    expect(normalize('São Paulo')).toBe('sao paulo')
    expect(normalize('Data de Saída')).toBe('data de saida')
  })

  it('replaces special characters with spaces', () => {
    expect(normalize('dt_saida')).toBe('dt saida')
    expect(normalize('col-name')).toBe('col name')
  })
})

describe('autoMap', () => {
  it('matches exact headers (case-insensitive, accent-insensitive)', () => {
    const targets = [
      makeTarget('origin', 'Origem'),
      makeTarget('destination', 'Destino'),
    ]
    const sources = [makeSource(0, 'Origem'), makeSource(1, 'Destino')]

    const mappings = autoMap(targets, sources)

    expect(mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetKey: 'origin',
          sourceIndex: 0,
          confidence: 1.0,
        }),
        expect.objectContaining({
          targetKey: 'destination',
          sourceIndex: 1,
          confidence: 1.0,
        }),
      ]),
    )
  })

  it('matches with different casing and accents', () => {
    const targets = [makeTarget('origin', 'Origem')]
    const sources = [makeSource(0, 'ORIGEM')]

    const mappings = autoMap(targets, sources)

    expect(mappings).toHaveLength(1)
    expect(mappings[0].targetKey).toBe('origin')
    expect(mappings[0].confidence).toBe(1.0)
  })

  it('matches fuzzy ("orig" → "Origem")', () => {
    const targets = [makeTarget('origin', 'Origem')]
    const sources = [makeSource(0, 'orig')]

    const mappings = autoMap(targets, sources)

    expect(mappings).toHaveLength(1)
    expect(mappings[0].targetKey).toBe('origin')
    expect(mappings[0].sourceIndex).toBe(0)
    expect(mappings[0].confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('matches with abbreviation ("dt_saida" → "Data de Saída")', () => {
    const targets = [makeTarget('departure_date', 'Data de Saída')]
    const sources = [makeSource(0, 'dt_saida')]

    const mappings = autoMap(targets, sources)

    expect(mappings).toHaveLength(1)
    expect(mappings[0].targetKey).toBe('departure_date')
    expect(mappings[0].confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('matches abbreviation "mot" → "Motorista"', () => {
    const targets = [makeTarget('driver', 'Motorista')]
    const sources = [makeSource(0, 'mot')]

    const mappings = autoMap(targets, sources)

    expect(mappings).toHaveLength(1)
    expect(mappings[0].targetKey).toBe('driver')
    expect(mappings[0].confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('does not duplicate source mappings', () => {
    const targets = [
      makeTarget('name', 'Nome'),
      makeTarget('full_name', 'Nome Completo'),
    ]
    const sources = [makeSource(0, 'Nome')]

    const mappings = autoMap(targets, sources)

    const sourceIndicesUsed = mappings.map((m) => m.sourceIndex)
    const unique = new Set(sourceIndicesUsed)
    expect(unique.size).toBe(sourceIndicesUsed.length)
  })

  it('does not duplicate target mappings', () => {
    const targets = [makeTarget('origin', 'Origem')]
    const sources = [makeSource(0, 'Origem'), makeSource(1, 'Origem City')]

    const mappings = autoMap(targets, sources)

    const targetKeysUsed = mappings.map((m) => m.targetKey)
    const unique = new Set(targetKeysUsed)
    expect(unique.size).toBe(targetKeysUsed.length)
  })

  it('does not suggest when below threshold', () => {
    const targets = [makeTarget('origin', 'Origem')]
    const sources = [makeSource(0, 'XYZABC')]

    const mappings = autoMap(targets, sources)

    expect(mappings).toHaveLength(0)
  })

  it('returns empty array for empty inputs', () => {
    expect(autoMap([], [])).toEqual([])
    expect(autoMap([makeTarget('a', 'A')], [])).toEqual([])
    expect(autoMap([], [makeSource(0, 'B')])).toEqual([])
  })

  it('handles mixed matched and unmatched columns', () => {
    const targets = [
      makeTarget('origin', 'Origem'),
      makeTarget('destination', 'Destino'),
      makeTarget('weight', 'Peso'),
    ]
    const sources = [
      makeSource(0, 'Origem'),
      makeSource(1, 'unknown_col'),
      makeSource(2, 'Destino'),
    ]

    const mappings = autoMap(targets, sources)

    const mapped = new Map(mappings.map((m) => [m.targetKey, m.sourceIndex]))
    expect(mapped.get('origin')).toBe(0)
    expect(mapped.get('destination')).toBe(2)
    // weight não deve mapear para unknown_col
    expect(mapped.has('weight')).toBe(false)
  })

  it('prefers exact match over fuzzy match', () => {
    const targets = [makeTarget('origin', 'Origem')]
    const sources = [
      makeSource(0, 'orig'),
      makeSource(1, 'Origem'),
    ]

    const mappings = autoMap(targets, sources)

    expect(mappings).toHaveLength(1)
    expect(mappings[0].sourceIndex).toBe(1)
    expect(mappings[0].confidence).toBe(1.0)
  })
})
