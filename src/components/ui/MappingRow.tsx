import { MappingSelect } from './MappingSelect'
import type { TargetColumn, SourceColumn } from '@/types/column'

export interface MappingRowProps {
  target: TargetColumn
  sourceColumns: SourceColumn[]
  selectedSourceIndex: number | null
  confidence?: number
  usedIndices: Set<number>
  onChange: (targetKey: string, sourceIndex: number | null) => void
}

export function MappingRow({
  target,
  sourceColumns,
  selectedSourceIndex,
  confidence,
  usedIndices,
  onChange,
}: MappingRowProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-md border px-4 py-3"
      data-testid={`mapping-row-${target.key}`}
    >
      <div className="min-w-[180px]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{target.label}</span>
          {target.required ? (
            <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 text-xs font-medium">
              obrigatório
            </span>
          ) : (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
              opcional
            </span>
          )}
        </div>
        {target.description && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {target.description}
          </p>
        )}
      </div>

      <div className="flex-1">
        <MappingSelect
          sourceColumns={sourceColumns}
          value={selectedSourceIndex}
          onChange={(idx) => onChange(target.key, idx)}
          usedIndices={usedIndices}
          required={target.required}
        />
      </div>

      {confidence !== undefined && confidence < 1.0 && (
        <span className="text-muted-foreground whitespace-nowrap text-xs">
          {Math.round(confidence * 100)}% match
        </span>
      )}
    </div>
  )
}
