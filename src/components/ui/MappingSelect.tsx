import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SourceColumn } from '@/types/column'

export interface MappingSelectProps {
  sourceColumns: SourceColumn[]
  value: number | null
  onChange: (sourceIndex: number | null) => void
  usedIndices: Set<number>
  required?: boolean
}

export function MappingSelect({
  sourceColumns,
  value,
  onChange,
  usedIndices,
  required = false,
}: MappingSelectProps) {
  const displayValue = value !== null ? String(value) : ''

  return (
    <Select.Root
      value={displayValue}
      onValueChange={(val) => {
        onChange(val === '__none__' ? null : Number(val))
      }}
    >
      <Select.Trigger
        className={cn(
          'border-input bg-background ring-offset-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
          'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !displayValue && 'text-muted-foreground',
        )}
        data-testid="mapping-select-trigger"
      >
        <Select.Value placeholder="Selecione uma coluna..." />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="bg-popover text-popover-foreground z-50 max-h-60 overflow-auto rounded-md border shadow-md"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {!required && (
              <Select.Item
                value="__none__"
                className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-sm px-8 py-2 text-sm outline-none select-none"
              >
                <Select.ItemIndicator className="absolute left-2">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
                <Select.ItemText>
                  <span className="text-muted-foreground italic">
                    Não mapear
                  </span>
                </Select.ItemText>
              </Select.Item>
            )}

            {sourceColumns.map((col) => {
              const isUsed =
                usedIndices.has(col.index) && col.index !== value
              return (
                <Select.Item
                  key={col.index}
                  value={String(col.index)}
                  disabled={isUsed}
                  className={cn(
                    'relative flex cursor-pointer flex-col rounded-sm px-8 py-2 text-sm outline-none select-none',
                    'hover:bg-accent focus:bg-accent',
                    isUsed && 'opacity-40',
                  )}
                >
                  <Select.ItemIndicator className="absolute left-2 top-2.5">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{col.header}</Select.ItemText>
                  {col.sampleValues.length > 0 && (
                    <span className="text-muted-foreground mt-0.5 text-xs">
                      ex: {col.sampleValues.slice(0, 3).join(', ')}
                    </span>
                  )}
                </Select.Item>
              )
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
