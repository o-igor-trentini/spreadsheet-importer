import { useEffect, useMemo, useCallback } from 'react'
import { DataPreview } from '@/components/ui/DataPreview'
import { MappingRow } from '@/components/ui/MappingRow'
import { useImporterStore } from '@/hooks/use-importer-store'
import { autoMap } from '@/lib/auto-mapper'
import type { TargetColumn, ColumnMapping as ColumnMappingType } from '@/types/column'

export interface ColumnMappingProps {
  columns: TargetColumn[]
  onNext: () => void
  onBack: () => void
}

export function ColumnMapping({ columns, onNext, onBack }: ColumnMappingProps) {
  const sourceColumns = useImporterStore((s) => s.sourceColumns)
  const previewData = useImporterStore((s) => s.previewData)
  const mappings = useImporterStore((s) => s.mappings)
  const setMappings = useImporterStore((s) => s.setMappings)

  // Auto-map on mount if no mappings exist
  useEffect(() => {
    if (mappings.length === 0 && sourceColumns.length > 0) {
      const autoMappings = autoMap(columns, sourceColumns)
      setMappings(autoMappings)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const mappingsByTarget = useMemo(() => {
    const map = new Map<string, ColumnMappingType>()
    for (const m of mappings) {
      map.set(m.targetKey, m)
    }
    return map
  }, [mappings])

  const usedIndices = useMemo(() => {
    return new Set(mappings.map((m) => m.sourceIndex))
  }, [mappings])

  const handleChange = useCallback(
    (targetKey: string, sourceIndex: number | null) => {
      const updated = mappings.filter((m) => m.targetKey !== targetKey)
      if (sourceIndex !== null) {
        updated.push({ targetKey, sourceIndex })
      }
      setMappings(updated)
    },
    [mappings, setMappings],
  )

  const allRequiredMapped = useMemo(() => {
    return columns
      .filter((c) => c.required)
      .every((c) => mappingsByTarget.has(c.key))
  }, [columns, mappingsByTarget])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Mapeamento de colunas</h2>
        <p className="text-muted-foreground text-sm">
          Associe cada coluna esperada a uma coluna da planilha importada.
        </p>
      </div>

      <DataPreview
        sourceColumns={sourceColumns}
        previewData={previewData}
      />

      <div className="space-y-2">
        {columns.map((target) => {
          const mapping = mappingsByTarget.get(target.key)
          return (
            <MappingRow
              key={target.key}
              target={target}
              sourceColumns={sourceColumns}
              selectedSourceIndex={mapping?.sourceIndex ?? null}
              confidence={mapping?.confidence}
              usedIndices={usedIndices}
              onChange={handleChange}
            />
          )
        })}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!allRequiredMapped}
          data-testid="next-button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  )
}
