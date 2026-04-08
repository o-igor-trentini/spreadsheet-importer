import { useCallback, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AllowedFormat } from '@/types/importer'

type DropzoneState = 'idle' | 'dragover' | 'error' | 'processing'

export interface DropzoneProps {
  onFile: (file: File) => void
  allowedFormats?: AllowedFormat[]
  maxFileSize?: number
  isProcessing?: boolean
  error?: string | null
  className?: string
}

const FORMAT_LABELS: Record<string, string> = {
  '.csv': 'CSV',
  '.xlsx': 'Excel (.xlsx)',
  '.xls': 'Excel (.xls)',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : ''
}

export function Dropzone({
  onFile,
  allowedFormats = ['.csv', '.xlsx', '.xls'],
  maxFileSize,
  isProcessing = false,
  error,
  className,
}: DropzoneProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [dragover, setDragover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayError = error ?? localError

  const state: DropzoneState = isProcessing
    ? 'processing'
    : displayError
      ? 'error'
      : dragover
        ? 'dragover'
        : 'idle'

  const validateFile = useCallback(
    (file: File): string | null => {
      const ext = getFileExtension(file.name)
      if (!allowedFormats.includes(ext as AllowedFormat)) {
        const accepted = allowedFormats
          .map((f) => FORMAT_LABELS[f] ?? f)
          .join(', ')
        return `Formato não suportado. Aceitos: ${accepted}`
      }
      if (maxFileSize && file.size > maxFileSize) {
        return `Arquivo muito grande (${formatBytes(file.size)}). Máximo: ${formatBytes(maxFileSize)}`
      }
      return null
    },
    [allowedFormats, maxFileSize],
  )

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null)
      const validationError = validateFile(file)
      if (validationError) {
        setLocalError(validationError)
        return
      }
      onFile(file)
    },
    [validateFile, onFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragover(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragover(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragover(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!isProcessing) inputRef.current?.click()
  }, [isProcessing])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile],
  )

  const acceptString = allowedFormats.join(',')

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="dropzone"
      data-state={state}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick()
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        state === 'idle' && 'border-border hover:border-primary/50 hover:bg-accent/50',
        state === 'dragover' && 'border-primary bg-accent',
        state === 'error' && 'border-destructive/50 bg-destructive/5',
        state === 'processing' && 'cursor-wait border-primary/50 bg-accent/30',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        onChange={handleInputChange}
        className="hidden"
        data-testid="file-input"
      />

      {state === 'processing' ? (
        <>
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Processando arquivo...
          </p>
        </>
      ) : state === 'error' ? (
        <>
          <AlertCircle className="text-destructive h-10 w-10" />
          <p className="text-destructive text-sm">{displayError}</p>
          <p className="text-muted-foreground text-xs">
            Clique ou arraste para tentar novamente
          </p>
        </>
      ) : state === 'dragover' ? (
        <>
          <FileSpreadsheet className="text-primary h-10 w-10" />
          <p className="text-primary text-sm font-medium">
            Solte o arquivo aqui
          </p>
        </>
      ) : (
        <>
          <Upload className="text-muted-foreground h-10 w-10" />
          <div>
            <p className="text-sm font-medium">
              Arraste sua planilha aqui ou clique para selecionar
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {allowedFormats.map((f) => FORMAT_LABELS[f] ?? f).join(', ')}
              {maxFileSize && ` — até ${formatBytes(maxFileSize)}`}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
