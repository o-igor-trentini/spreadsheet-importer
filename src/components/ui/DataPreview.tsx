import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
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
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: previewData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
  })

  if (sourceColumns.length === 0) return null

  return (
    <div
      ref={parentRef}
      className={cn(
        'overflow-auto rounded-md border',
        className,
      )}
      style={{ maxHeight: 300 }}
    >
      <table className="w-full text-sm">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            {sourceColumns.map((col) => (
              <th
                key={col.index}
                className="text-muted-foreground whitespace-nowrap px-3 py-2 text-left font-medium"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = previewData[virtualRow.index]
            return (
              <tr
                key={virtualRow.index}
                data-index={virtualRow.index}
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
                {sourceColumns.map((col) => (
                  <td
                    key={col.index}
                    className="whitespace-nowrap px-3 py-2"
                  >
                    {row?.[col.index] ?? ''}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
