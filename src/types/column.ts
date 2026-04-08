export type ColumnType =
  | 'string'
  | 'number'
  | 'date'
  | 'email'
  | 'boolean'
  | 'enum'
  | 'custom'

export type ValidatorType =
  | 'required'
  | 'regex'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'enum'
  | 'custom'

export interface ColumnValidator {
  type: ValidatorType
  value?: string | number | string[]
  message?: string
  validate?: (value: unknown) => boolean
}

export interface TargetColumn {
  key: string
  label: string
  required: boolean
  type: ColumnType
  description?: string
  validators?: ColumnValidator[]
  enumValues?: string[]
  transform?: (value: unknown) => unknown
}

export interface SourceColumn {
  index: number
  header: string
  sampleValues: string[]
}

export interface ColumnMapping {
  targetKey: string
  sourceIndex: number
  confidence?: number
}
