import { parsePreview, extractDataChunks } from '@/lib/parser-logic'
import type { WorkerRequest, WorkerResponse } from '@/types/worker'

function postResponse(response: WorkerResponse) {
  self.postMessage(response)
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data

  try {
    switch (request.type) {
      case 'parse-preview': {
        const result = parsePreview(request.data, request.previewRowCount)
        postResponse({
          type: 'parse-preview-result',
          ...result,
        })
        break
      }

      case 'extract-data': {
        for (const chunk of extractDataChunks(
          request.data,
          request.mappings,
          request.chunkSize,
        )) {
          postResponse({
            type: 'extract-data-chunk',
            rows: chunk.rows,
            startRow: chunk.startRow,
            totalRows: chunk.totalRows,
          })
        }
        postResponse({
          type: 'extract-data-done',
          totalRows: 0,
        })
        break
      }
    }
  } catch (error) {
    postResponse({
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao processar o arquivo.',
    })
  }
}
