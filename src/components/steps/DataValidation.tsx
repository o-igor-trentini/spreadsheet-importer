import { useEffect, useCallback } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { ValidationTable } from '@/components/ui/ValidationTable'
import { useImporterStore } from '@/hooks/use-importer-store'
import { useValidator } from '@/hooks/use-validator'
import type { TargetColumn } from '@/types/column'

export interface DataValidationProps {
  columns: TargetColumn[]
  onNext: () => void
  onBack: () => void
}

export function DataValidation({
  columns,
  onNext,
  onBack,
}: DataValidationProps) {
  const fileData = useImporterStore((s) => s.fileData)
  const mappings = useImporterStore((s) => s.mappings)
  const validationResult = useImporterStore((s) => s.validationResult)
  const setValidationResult = useImporterStore((s) => s.setValidationResult)

  const { validate, isValidating, progress, result } = useValidator()

  const runValidation = useCallback(async () => {
    if (!fileData) return
    const res = await validate(fileData, columns, mappings)
    setValidationResult(res)
  }, [fileData, columns, mappings, validate, setValidationResult])

  // Run validation on mount
  useEffect(() => {
    if (!validationResult && fileData) {
      runValidation()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayResult = result ?? validationResult
  const canProceed = displayResult ? displayResult.errorCount === 0 : false

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Validação dos dados</h2>
        <p className="text-muted-foreground text-sm">
          Verificando a integridade dos dados antes da importação.
        </p>
      </div>

      {isValidating && (
        <div className="space-y-2" data-testid="validation-progress">
          <Progress.Root
            className="bg-secondary relative h-3 w-full overflow-hidden rounded-full"
            value={progress}
          >
            <Progress.Indicator
              className="bg-primary h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
          <p className="text-muted-foreground text-center text-sm">
            Validando... {progress}%
          </p>
        </div>
      )}

      {displayResult && !isValidating && (
        <>
          <div
            className="flex flex-wrap gap-4 rounded-lg border p-4"
            data-testid="validation-summary"
          >
            <div className="flex items-center gap-2">
              {displayResult.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="text-destructive h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {displayResult.validRows} de {displayResult.totalRows} linhas
                válidas
              </span>
            </div>

            {displayResult.errorCount > 0 && (
              <div className="text-destructive flex items-center gap-1 text-sm">
                <XCircle className="h-4 w-4" />
                {displayResult.errorCount} erro{displayResult.errorCount !== 1 && 's'}
              </div>
            )}

            {displayResult.warningCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                {displayResult.warningCount} aviso{displayResult.warningCount !== 1 && 's'}
              </div>
            )}
          </div>

          {displayResult.issues.length > 0 && (
            <ValidationTable issues={displayResult.issues} />
          )}
        </>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium"
        >
          Voltar
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setValidationResult(null)
              runValidation()
            }}
            disabled={isValidating}
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Revalidar
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed || isValidating}
            data-testid="next-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  )
}
