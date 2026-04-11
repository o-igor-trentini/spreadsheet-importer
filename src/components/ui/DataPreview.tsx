import { cn } from '@/lib/utils'
import type { SourceColumn } from '@/types/column'

export interface DataPreviewProps {
  sourceColumns: SourceColumn[]
  previewData: string[][]
  className?: string
}

export function DataPreview({
  sourceColumns,
  previewData,
  className,
}: DataPreviewProps) {
  if (sourceColumns.length === 0) return null

  return (
    <div
      className={cn(
        'max-h-[300px] overflow-auto rounded-md border',
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/80 sticky top-0 z-10">
          <tr>
            {sourceColumns.map((col) => (
              <th
                key={col.index}
                className="bg-muted/80 whitespace-nowrap border-b px-3 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-b-0">
              {sourceColumns.map((col) => (
                <td
                  key={col.index}
                  className="max-w-[200px] truncate whitespace-nowrap px-3 py-2"
                >
                  {row[col.index] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
