import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationIssue, ValidationSeverity } from '@/types/validation'

export interface ValidationTableProps {
  issues: ValidationIssue[]
  className?: string
}

type SeverityFilter = 'all' | ValidationSeverity

export function ValidationTable({ issues, className }: ValidationTableProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [columnFilter, setColumnFilter] = useState<string>('all')
  const parentRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => {
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

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
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

        {columns.length > 1 && (
          <select
            value={columnFilter}
            onChange={(e) => setColumnFilter(e.target.value)}
            className="border-input bg-background rounded-md border px-2 py-1 text-xs"
          >
            <option value="all">Todas as colunas</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        ref={parentRef}
        className="overflow-auto rounded-md border"
        style={{ maxHeight: 400 }}
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Linha</th>
              <th className="px-3 py-2 text-left font-medium">Coluna</th>
              <th className="px-3 py-2 text-left font-medium">Valor</th>
              <th className="px-3 py-2 text-left font-medium">Severidade</th>
              <th className="px-3 py-2 text-left font-medium">Mensagem</th>
            </tr>
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const issue = filtered[virtualRow.index]
              return (
                <tr
                  key={virtualRow.index}
                  className="border-b"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="px-3 py-2">{issue.row}</td>
                  <td className="px-3 py-2">{issue.columnKey}</td>
                  <td className="text-muted-foreground max-w-[200px] truncate px-3 py-2">
                    {issue.value === null || issue.value === undefined
                      ? '(vazio)'
                      : String(issue.value)}
                  </td>
                  <td className="px-3 py-2">
                    {issue.severity === 'error' ? (
                      <span className="text-destructive inline-flex items-center gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        erro
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        aviso
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{issue.message}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhum problema encontrado.
          </p>
        )}
      </div>
    </div>
  )
}
