import type { ColumnMapping } from '@/types/column'
import type {
  ParsePreviewResponse,
  WorkerRequest,
  WorkerResponse,
} from '@/types/worker'
import { parsePreview, extractDataChunks } from './parser-logic'

export type { ParsePreviewResult } from './parser-logic'

function createParserWorker(): Worker | null {
  try {
    return new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    })
  } catch (err) {
    console.warn(
      '[spreadsheet-importer] Web Worker não disponível, usando main thread.',
      err,
    )
    return null
  }
}

function sendWorkerRequest(
  worker: Worker,
  request: WorkerRequest,
  transfer?: Transferable[],
): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      resolve(event.data)
    }
    worker.onerror = (event) => {
      reject(
        new Error(
          event.message ||
            'Falha ao executar o Web Worker de parsing. Verifique se o arquivo parser.worker.js está acessível.',
        ),
      )
    }
    worker.postMessage(request, transfer ?? [])
  })
}

export async function parseFilePreview(
  data: ArrayBuffer,
  previewRowCount = 10,
): Promise<ParsePreviewResponse> {
  const worker = createParserWorker()

  if (!worker) {
    const result = parsePreview(data, previewRowCount)
    return { type: 'parse-preview-result', ...result }
  }

  try {
    const dataCopy = data.slice(0)
    const response = await sendWorkerRequest(
      worker,
      { type: 'parse-preview', data: dataCopy, previewRowCount },
      [dataCopy],
    )

    if (response.type === 'error') {
      throw new Error(response.message)
    }

    return response as ParsePreviewResponse
  } catch (err) {
    // Worker failed — fallback to main thread
    console.warn(
      '[spreadsheet-importer] Worker falhou, usando fallback no main thread.',
      err,
    )
    worker.terminate()
    const result = parsePreview(data, previewRowCount)
    return { type: 'parse-preview-result', ...result }
  } finally {
    worker.terminate()
  }
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

async function extractOnMainThread(
  data: ArrayBuffer,
  mappings: ColumnMapping[],
  chunkSize: number,
  onChunk?: (rows: string[][], startRow: number, totalRows: number) => void,
): Promise<string[][]> {
  const allRows: string[][] = []
  for (const chunk of extractDataChunks(data, mappings, chunkSize)) {
    allRows.push(...chunk.rows)
    onChunk?.(chunk.rows, chunk.startRow, chunk.totalRows)
    await yieldToMain()
  }
  return allRows
}

export async function extractAllData(
  data: ArrayBuffer,
  mappings: ColumnMapping[],
  chunkSize = 5000,
  onChunk?: (rows: string[][], startRow: number, totalRows: number) => void,
): Promise<string[][]> {
  const worker = createParserWorker()

  if (!worker) {
    return extractOnMainThread(data, mappings, chunkSize, onChunk)
  }

  try {
    return await new Promise((resolve, reject) => {
      const allRows: string[][] = []

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data

        switch (response.type) {
          case 'extract-data-chunk':
            allRows.push(...response.rows)
            onChunk?.(response.rows, response.startRow, response.totalRows)
            break
          case 'extract-data-done':
            worker.terminate()
            resolve(allRows)
            break
          case 'error':
            worker.terminate()
            reject(new Error(response.message))
            break
        }
      }

      worker.onerror = (event) => {
        worker.terminate()
        reject(
          new Error(
            event.message ||
              'Falha ao executar o Web Worker de parsing.',
          ),
        )
      }

      const dataCopy = data.slice(0)
      worker.postMessage(
        { type: 'extract-data', data: dataCopy, mappings, chunkSize },
        [dataCopy],
      )
    })
  } catch (err) {
    console.warn(
      '[spreadsheet-importer] Worker falhou, usando fallback no main thread.',
      err,
    )
    worker.terminate()
    return extractOnMainThread(data, mappings, chunkSize, onChunk)
  }
}
