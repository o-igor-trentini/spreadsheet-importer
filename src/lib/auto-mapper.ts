import Fuse from 'fuse.js'
import type { TargetColumn, SourceColumn, ColumnMapping } from '@/types/column'

const ABBREVIATIONS: Record<string, string[]> = {
  dt: ['data', 'date'],
  num: ['numero', 'number'],
  orig: ['origem', 'origin'],
  dest: ['destino', 'destination'],
  mot: ['motorista', 'driver'],
  end: ['endereco', 'address'],
  tel: ['telefone', 'phone'],
  obs: ['observacao', 'observation'],
  qtd: ['quantidade', 'quantity'],
  val: ['valor', 'value'],
  desc: ['descricao', 'description'],
  ref: ['referencia', 'reference'],
  sts: ['status'],
  cat: ['categoria', 'category'],
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ') // non-alphanumeric → space
    .replace(/\s+/g, ' ')
    .trim()
}

function expandAbbreviations(text: string): string[] {
  const normalized = normalize(text)
  const words = normalized.split(/[\s_]+/)
  const expanded: string[] = [normalized]

  for (const word of words) {
    const expansions = ABBREVIATIONS[word]
    if (expansions) {
      for (const exp of expansions) {
        expanded.push(normalized.replace(word, exp))
      }
    }
  }

  return expanded
}

const CONFIDENCE_THRESHOLD = 0.6

export function autoMap(
  targetColumns: TargetColumn[],
  sourceColumns: SourceColumn[],
): ColumnMapping[] {
  if (sourceColumns.length === 0 || targetColumns.length === 0) return []

  // Build searchable items from source columns with expanded forms
  const sourceItems = sourceColumns.flatMap((col) => {
    const expanded = expandAbbreviations(col.header)
    return expanded.map((text) => ({
      text,
      index: col.index,
      original: col.header,
    }))
  })

  const fuse = new Fuse(sourceItems, {
    keys: ['text'],
    threshold: 0.4, // Fuse threshold (lower = stricter)
    includeScore: true,
  })

  const mappings: ColumnMapping[] = []
  const usedSourceIndices = new Set<number>()

  // Score each target against all sources, then assign greedily by best score
  const candidates: {
    targetKey: string
    sourceIndex: number
    confidence: number
  }[] = []

  for (const target of targetColumns) {
    const targetNormalized = normalize(target.label)
    const targetExpanded = expandAbbreviations(target.label)

    // Check exact match first
    for (const source of sourceColumns) {
      const sourceNormalized = normalize(source.header)
      if (sourceNormalized === targetNormalized) {
        candidates.push({
          targetKey: target.key,
          sourceIndex: source.index,
          confidence: 1.0,
        })
      }
    }

    // Also check expanded target forms against expanded source via Fuse
    for (const targetForm of targetExpanded) {
      const results = fuse.search(targetForm)
      for (const result of results) {
        const fuseScore = result.score ?? 1
        const confidence = Math.round((1 - fuseScore) * 100) / 100

        if (confidence >= CONFIDENCE_THRESHOLD) {
          candidates.push({
            targetKey: target.key,
            sourceIndex: result.item.index,
            confidence,
          })
        }
      }
    }
  }

  // Sort by confidence descending, then assign greedily
  candidates.sort((a, b) => b.confidence - a.confidence)

  const usedTargetKeys = new Set<string>()

  for (const c of candidates) {
    if (usedTargetKeys.has(c.targetKey) || usedSourceIndices.has(c.sourceIndex))
      continue

    mappings.push({
      targetKey: c.targetKey,
      sourceIndex: c.sourceIndex,
      confidence: c.confidence,
    })
    usedTargetKeys.add(c.targetKey)
    usedSourceIndices.add(c.sourceIndex)
  }

  return mappings
}
