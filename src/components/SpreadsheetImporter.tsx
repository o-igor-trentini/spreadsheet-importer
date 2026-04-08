import { StoreProvider } from '@/store/store-provider'
import { WizardShell } from './WizardShell'
import { cn } from '@/lib/utils'
import type { SpreadsheetImporterProps } from '@/types/importer'

export function SpreadsheetImporter({
  columns,
  onComplete,
  onCancel,
  onStepChange,
  sessionKey,
  maxFileSize,
  allowedFormats,
  previewRowCount,
  className,
  persistStorage,
}: SpreadsheetImporterProps) {
  return (
    <StoreProvider sessionKey={sessionKey} storage={persistStorage}>
      <div className={cn('w-full', className)}>
        <WizardShell
          columns={columns}
          onComplete={onComplete}
          onCancel={onCancel}
          onStepChange={onStepChange}
          allowedFormats={allowedFormats}
          maxFileSize={maxFileSize}
          previewRowCount={previewRowCount}
        />
      </div>
    </StoreProvider>
  )
}
