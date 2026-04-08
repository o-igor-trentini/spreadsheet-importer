import { useCallback, useState } from 'react'
import { parseFilePreview } from '@/lib/parser'
import type { ParsePreviewResult } from '@/lib/parser'

interface UseFileParserReturn {
  parseFile: (file: File) => Promise<ParsePreviewResult | null>
  isProcessing: boolean
  error: string | null
}

export function useFileParser(
  previewRowCount = 10,
): UseFileParserReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseFile = useCallback(
    async (file: File): Promise<ParsePreviewResult | null> => {
      setIsProcessing(true)
      setError(null)

      try {
        const buffer = await file.arrayBuffer()
        const result = await parseFilePreview(buffer, previewRowCount)
        return result
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro desconhecido ao processar o arquivo.'
        setError(message)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [previewRowCount],
  )

  return { parseFile, isProcessing, error }
}
