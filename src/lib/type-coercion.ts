export function coerceToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return isNaN(value) ? null : value

  const str = String(value).trim()
  if (str === '') return null

  // Standard format first (no comma)
  const num = Number(str)
  if (!isNaN(num)) return num

  // Try pt-BR format if contains comma: "1.234,56" → "1234.56"
  if (str.includes(',')) {
    const ptBr = str.replace(/\./g, '').replace(',', '.')
    const numPtBr = Number(ptBr)
    if (!isNaN(numPtBr) && ptBr !== '') return numPtBr
  }

  return null
}

const DATE_PATTERNS: {
  regex: RegExp
  parse: (m: RegExpMatchArray) => Date
}[] = [
  // DD/MM/YYYY or DD-MM-YYYY
  {
    regex: /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/,
    parse: (m) => new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])),
  },
  // YYYY-MM-DD
  {
    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    parse: (m) => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
  },
  // DD/MM/YYYY HH:mm or DD/MM/YYYY HH:mm:ss
  {
    regex:
      /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
    parse: (m) =>
      new Date(
        Number(m[3]),
        Number(m[2]) - 1,
        Number(m[1]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6] ?? 0),
      ),
  },
  // YYYY-MM-DDTHH:mm:ss (ISO-ish)
  {
    regex: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
    parse: (m) =>
      new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6]),
      ),
  },
]

export function coerceToDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value

  const str = String(value).trim()
  if (str === '') return null

  for (const pattern of DATE_PATTERNS) {
    const match = str.match(pattern.regex)
    if (match) {
      const date = pattern.parse(match)
      if (!isNaN(date.getTime())) return date
    }
  }

  // Fallback to native Date parse
  const fallback = new Date(str)
  if (!isNaN(fallback.getTime())) return fallback

  return null
}

const TRUE_VALUES = new Set([
  'true',
  '1',
  'sim',
  'yes',
  's',
  'y',
  'verdadeiro',
])
const FALSE_VALUES = new Set([
  'false',
  '0',
  'não',
  'nao',
  'no',
  'n',
  'falso',
])

export function coerceToBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value

  const str = String(value).trim().toLowerCase()
  if (str === '') return null

  if (TRUE_VALUES.has(str)) return true
  if (FALSE_VALUES.has(str)) return false

  return null
}
