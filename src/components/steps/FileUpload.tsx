import { useCallback } from 'react'
import { Dropzone } from '@/components/ui/Dropzone'
import { useFileParser } from '@/hooks/use-file-parser'
import { useImporterStore } from '@/hooks/use-importer-store'
import type { AllowedFormat } from '@/types/importer'

export interface FileUploadProps {
  allowedFormats?: AllowedFormat[]
  maxFileSize?: number
  previewRowCount?: number
}

export function FileUpload({
  allowedFormats,
  maxFileSize,
  previewRowCount = 10,
}: FileUploadProps) {
  const setFileData = useImporterStore((s) => s.setFileData)
  const setStep = useImporterStore((s) => s.setStep)
  const { parseFile, isProcessing, error } = useFileParser(previewRowCount)

  const handleFile = useCallback(
    async (file: File) => {
      const result = await parseFile(file)
      if (!result) return

      const buffer = await file.arrayBuffer()
      setFileData({
        fileName: file.name,
        fileData: buffer,
        sourceColumns: result.sourceColumns,
        previewData: result.previewData,
        totalRows: result.totalRows,
      })
      setStep('mapping')
    },
    [parseFile, setFileData, setStep],
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Upload da planilha</h2>
        <p className="text-muted-foreground text-sm">
          Selecione ou arraste o arquivo que deseja importar.
        </p>
      </div>
      <Dropzone
        onFile={handleFile}
        allowedFormats={allowedFormats}
        maxFileSize={maxFileSize}
        isProcessing={isProcessing}
        error={error}
      />
    </div>
  )
}
