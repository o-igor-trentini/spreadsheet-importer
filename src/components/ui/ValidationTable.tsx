import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationIssue, ValidationSeverity } from '@/types/validation'

export interface ValidationTableProps {
  issues: ValidationIssue[]
  columnLabels?: Record<string, string>
  className?: string
}

type SeverityFilter = 'all' | ValidationSeverity

const COL_GRID = 'grid-cols-[60px_120px_160px_90px_1fr]'

export function ValidationTable({
  issues,
  columnLabels = {},
  className,
}: ValidationTableProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [columnFilter, setColumnFilter] = useState<string>('all')
  const parentRef = useRef<HTMLDivElement>(null)

  const resolveLabel = (key: string) => columnLabels[key] ?? key

  const columnKeys = useMemo(() => {
    const unique = new Set(issues.map((i) => i.columnKey))
    return Array.from(unique).sort()
  }, [issues])

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter !== 'all' && issue.severity !== severityFilter)
        return false
      if (columnFilter !== 'all' && issue.columnKey !== columnFilter)
        return false
      return true
    })
  }, [issues, severityFilter, columnFilter])

  const errorCount = useMemo(
    () => issues.filter((i) => i.severity === 'error').length,
    [issues],
  )
  const warningCount = useMemo(
    () => issues.filter((i) => i.severity === 'warning').length,
    [issues],
  )

  const filteredCount = filtered.length

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  })

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setSeverityFilter('all')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              severityFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            Todos ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('error')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              severityFilter === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            Erros ({errorCount})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('warning')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              severityFilter === 'warning'
                ? 'bg-yellow-500 text-white'
                : 'bg-muted text-muted-foreground',
            )}
          >
            Avisos ({warningCount})
          </button>
        </div>

        {columnKeys.length > 1 && (
          <select
            value={columnFilter}
            onChange={(e) => setColumnFilter(e.target.value)}
            className="border-input bg-background rounded-md border px-2 py-1 text-xs"
          >
            <option value="all">Todas as colunas</option>
            {columnKeys.map((key) => (
              <option key={key} value={key}>
                {resolveLabel(key)}
              </option>
            ))}
          </select>
        )}
      </div>

      {filteredCount !== issues.length && (
        <p className="text-muted-foreground text-xs">
          Exibindo {filteredCount} de {issues.length} problemas
        </p>
      )}

      <div className="rounded-md border">
        <div
          className={cn(
            'bg-muted/80 grid gap-0 border-b px-3 py-2 text-xs font-medium text-muted-foreground',
            COL_GRID,
          )}
        >
          <span>Linha</span>
          <span>Coluna</span>
          <span>Valor</span>
          <span>Severidade</span>
          <span>Mensagem</span>
        </div>

        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight: 360 }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const issue = filtered[virtualRow.index]
              return (
                <div
                  key={virtualRow.index}
                  className={cn(
                    'grid items-center gap-0 border-b px-3 py-2 text-sm',
                    COL_GRID,
                  )}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <span>{issue.row}</span>
                  <span className="truncate">{resolveLabel(issue.columnKey)}</span>
                  <span className="truncate text-muted-foreground">
                    {issue.value === null || issue.value === undefined
                      ? '(vazio)'
                      : String(issue.value)}
                  </span>
                  <span>
                    {issue.severity === 'error' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        erro
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        aviso
                      </span>
                    )}
                  </span>
                  <span className="truncate">{issue.message}</span>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum problema encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
