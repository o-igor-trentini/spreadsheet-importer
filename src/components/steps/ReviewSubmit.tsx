import { useState, useCallback, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { DataPreview } from '@/components/ui/DataPreview'
import { useImporterStore } from '@/hooks/use-importer-store'
import { extractAllData } from '@/lib/parser'
import type { TargetColumn } from '@/types/column'

export interface ReviewSubmitProps {
  columns: TargetColumn[]
  onComplete: (data: Record<string, unknown>[]) => void
  onBack: () => void
}

export function ReviewSubmit({
  columns,
  onComplete,
  onBack,
}: ReviewSubmitProps) {
  const fileData = useImporterStore((s) => s.fileData)
  const mappings = useImporterStore((s) => s.mappings)
  const sourceColumns = useImporterStore((s) => s.sourceColumns)
  const previewData = useImporterStore((s) => s.previewData)
  const totalRows = useImporterStore((s) => s.totalRows)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mappingSummary = useMemo(() => {
    return mappings.map((m) => {
      const target = columns.find((c) => c.key === m.targetKey)
      const source = sourceColumns.find((c) => c.index === m.sourceIndex)
      return {
        targetKey: m.targetKey,
        targetLabel: target?.label ?? m.targetKey,
        sourceHeader: source?.header ?? `Coluna ${m.sourceIndex}`,
      }
    })
  }, [mappings, columns, sourceColumns])

  const handleSubmit = useCallback(async () => {
    if (!fileData) return
    setIsSubmitting(true)

    try {
      const allRows = await extractAllData(fileData, mappings)

      const data: Record<string, unknown>[] = allRows.map((row) => {
        const record: Record<string, unknown> = {}
        mappings.forEach((m, i) => {
          const col = columns.find((c) => c.key === m.targetKey)
          let value: unknown = row[i] ?? ''
          if (col?.transform) {
            value = col.transform(value)
          }
          record[m.targetKey] = value
        })
        return record
      })

      onComplete(data)
    } finally {
      setIsSubmitting(false)
    }
  }, [fileData, mappings, columns, onComplete])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revisão e envio</h2>
        <p className="text-muted-foreground text-sm">
          Confira o mapeamento e os dados antes de importar.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Mapeamento de colunas</h3>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">
                  Coluna destino
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  Coluna origem
                </th>
              </tr>
            </thead>
            <tbody>
              {mappingSummary.map((m) => (
                <tr key={m.targetKey} className="border-t">
                  <td className="px-3 py-2">{m.targetLabel}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {m.sourceHeader}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Preview dos dados</h3>
        <DataPreview sourceColumns={sourceColumns} previewData={previewData} />
      </div>

      <p className="text-muted-foreground text-sm" data-testid="row-count">
        <strong>{totalRows}</strong> linhas serão importadas.
      </p>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !fileData}
          data-testid="submit-button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Importar
        </button>
      </div>
    </div>
  )
}
