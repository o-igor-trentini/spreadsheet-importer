import { describe, it, expectTypeOf } from 'vitest'
import type {
  ColumnType,
  ValidatorType,
  ColumnValidator,
  TargetColumn,
  SourceColumn,
  ColumnMapping,
  ValidationSeverity,
  ValidationIssue,
  ValidationResult,
  ImporterStep,
  AllowedFormat,
  SpreadsheetImporterProps,
  ImporterState,
  ImporterActions,
  ImporterStore,
} from '../index'

describe('Column types', () => {
  it('ColumnType accepts valid values', () => {
    expectTypeOf<'string'>().toMatchTypeOf<ColumnType>()
    expectTypeOf<'number'>().toMatchTypeOf<ColumnType>()
    expectTypeOf<'date'>().toMatchTypeOf<ColumnType>()
    expectTypeOf<'email'>().toMatchTypeOf<ColumnType>()
    expectTypeOf<'boolean'>().toMatchTypeOf<ColumnType>()
    expectTypeOf<'enum'>().toMatchTypeOf<ColumnType>()
    expectTypeOf<'custom'>().toMatchTypeOf<ColumnType>()
  })

  it('ValidatorType accepts valid values', () => {
    expectTypeOf<'required'>().toMatchTypeOf<ValidatorType>()
    expectTypeOf<'regex'>().toMatchTypeOf<ValidatorType>()
    expectTypeOf<'min'>().toMatchTypeOf<ValidatorType>()
    expectTypeOf<'max'>().toMatchTypeOf<ValidatorType>()
    expectTypeOf<'custom'>().toMatchTypeOf<ValidatorType>()
  })

  it('ColumnValidator has correct shape', () => {
    expectTypeOf<ColumnValidator>().toHaveProperty('type')
    expectTypeOf<ColumnValidator>().toHaveProperty('value')
    expectTypeOf<ColumnValidator>().toHaveProperty('message')
    expectTypeOf<ColumnValidator>().toHaveProperty('validate')
  })

  it('TargetColumn has required and optional fields', () => {
    const col: TargetColumn = {
      key: 'origin',
      label: 'Origem',
      required: true,
      type: 'string',
    }
    expectTypeOf(col).toMatchTypeOf<TargetColumn>()

    const colFull: TargetColumn = {
      key: 'status',
      label: 'Status',
      required: true,
      type: 'enum',
      description: 'Status da viagem',
      validators: [{ type: 'required', message: 'Obrigatório' }],
      enumValues: ['ativo', 'inativo'],
      transform: (v) => String(v).toUpperCase(),
    }
    expectTypeOf(colFull).toMatchTypeOf<TargetColumn>()
  })

  it('SourceColumn has correct shape', () => {
    const col: SourceColumn = {
      index: 0,
      header: 'Origem',
      sampleValues: ['São Paulo', 'Rio de Janeiro'],
    }
    expectTypeOf(col).toMatchTypeOf<SourceColumn>()
  })

  it('ColumnMapping has correct shape', () => {
    const mapping: ColumnMapping = {
      targetKey: 'origin',
      sourceIndex: 0,
      confidence: 0.95,
    }
    expectTypeOf(mapping).toMatchTypeOf<ColumnMapping>()

    const mappingNoConfidence: ColumnMapping = {
      targetKey: 'origin',
      sourceIndex: 0,
    }
    expectTypeOf(mappingNoConfidence).toMatchTypeOf<ColumnMapping>()
  })
})

describe('Validation types', () => {
  it('ValidationSeverity accepts valid values', () => {
    expectTypeOf<'error'>().toMatchTypeOf<ValidationSeverity>()
    expectTypeOf<'warning'>().toMatchTypeOf<ValidationSeverity>()
  })

  it('ValidationIssue has correct shape', () => {
    const issue: ValidationIssue = {
      row: 1,
      columnKey: 'origin',
      severity: 'error',
      message: 'Campo obrigatório',
      value: null,
    }
    expectTypeOf(issue).toMatchTypeOf<ValidationIssue>()
  })

  it('ValidationResult has correct shape', () => {
    const result: ValidationResult = {
      isValid: false,
      totalRows: 100,
      validRows: 95,
      issues: [],
      errorCount: 3,
      warningCount: 2,
    }
    expectTypeOf(result).toMatchTypeOf<ValidationResult>()
  })
})

describe('Importer types', () => {
  it('ImporterStep accepts valid values', () => {
    expectTypeOf<'upload'>().toMatchTypeOf<ImporterStep>()
    expectTypeOf<'mapping'>().toMatchTypeOf<ImporterStep>()
    expectTypeOf<'validation'>().toMatchTypeOf<ImporterStep>()
    expectTypeOf<'review'>().toMatchTypeOf<ImporterStep>()
  })

  it('AllowedFormat accepts valid values', () => {
    expectTypeOf<'.csv'>().toMatchTypeOf<AllowedFormat>()
    expectTypeOf<'.xlsx'>().toMatchTypeOf<AllowedFormat>()
    expectTypeOf<'.xls'>().toMatchTypeOf<AllowedFormat>()
  })

  it('SpreadsheetImporterProps has required and optional fields', () => {
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('columns')
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('onComplete')
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('onCancel')
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('sessionKey')
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('maxFileSize')
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('allowedFormats')
    expectTypeOf<SpreadsheetImporterProps>().toHaveProperty('className')
  })
})

describe('Store types', () => {
  it('ImporterState has all fields', () => {
    expectTypeOf<ImporterState>().toHaveProperty('step')
    expectTypeOf<ImporterState>().toHaveProperty('fileName')
    expectTypeOf<ImporterState>().toHaveProperty('fileData')
    expectTypeOf<ImporterState>().toHaveProperty('sourceColumns')
    expectTypeOf<ImporterState>().toHaveProperty('previewData')
    expectTypeOf<ImporterState>().toHaveProperty('totalRows')
    expectTypeOf<ImporterState>().toHaveProperty('mappings')
    expectTypeOf<ImporterState>().toHaveProperty('validationResult')
    expectTypeOf<ImporterState>().toHaveProperty('isProcessing')
    expectTypeOf<ImporterState>().toHaveProperty('error')
  })

  it('ImporterActions has all methods', () => {
    expectTypeOf<ImporterActions>().toHaveProperty('setStep')
    expectTypeOf<ImporterActions>().toHaveProperty('setFileData')
    expectTypeOf<ImporterActions>().toHaveProperty('setMappings')
    expectTypeOf<ImporterActions>().toHaveProperty('setValidationResult')
    expectTypeOf<ImporterActions>().toHaveProperty('setProcessing')
    expectTypeOf<ImporterActions>().toHaveProperty('setError')
    expectTypeOf<ImporterActions>().toHaveProperty('reset')
  })

  it('ImporterStore combines State and Actions', () => {
    expectTypeOf<ImporterStore>().toMatchTypeOf<ImporterState>()
    expectTypeOf<ImporterStore>().toMatchTypeOf<ImporterActions>()
  })
})
