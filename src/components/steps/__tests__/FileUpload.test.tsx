import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropzone } from '@/components/ui/Dropzone'

function createFile(name: string, size: number, type = ''): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

describe('Dropzone', () => {
  it('renders with idle state by default', () => {
    render(<Dropzone onFile={vi.fn()} />)

    const dropzone = screen.getByTestId('dropzone')
    expect(dropzone).toHaveAttribute('data-state', 'idle')
    expect(
      screen.getByText('Arraste sua planilha aqui ou clique para selecionar'),
    ).toBeInTheDocument()
  })

  it('shows accepted formats', () => {
    render(
      <Dropzone onFile={vi.fn()} allowedFormats={['.csv', '.xlsx']} />,
    )

    expect(screen.getByText(/CSV, Excel \(\.xlsx\)/)).toBeInTheDocument()
  })

  it('shows max file size when provided', () => {
    render(
      <Dropzone
        onFile={vi.fn()}
        maxFileSize={10 * 1024 * 1024}
      />,
    )

    expect(screen.getByText(/até 10 MB/)).toBeInTheDocument()
  })

  it('shows processing state', () => {
    render(<Dropzone onFile={vi.fn()} isProcessing />)

    const dropzone = screen.getByTestId('dropzone')
    expect(dropzone).toHaveAttribute('data-state', 'processing')
    expect(screen.getByText('Processando arquivo...')).toBeInTheDocument()
  })

  it('shows error state with external error', () => {
    render(<Dropzone onFile={vi.fn()} error="Algo deu errado" />)

    const dropzone = screen.getByTestId('dropzone')
    expect(dropzone).toHaveAttribute('data-state', 'error')
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('rejects invalid file format via drop', () => {
    const onFile = vi.fn()
    render(
      <Dropzone onFile={onFile} allowedFormats={['.csv', '.xlsx']} />,
    )

    const dropzone = screen.getByTestId('dropzone')
    const invalidFile = createFile('data.pdf', 100)

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [invalidFile] },
    })

    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByText(/Formato não suportado/)).toBeInTheDocument()
  })

  it('rejects file exceeding max size', async () => {
    const onFile = vi.fn()
    const maxSize = 1024 // 1KB
    render(
      <Dropzone onFile={onFile} maxFileSize={maxSize} />,
    )

    const input = screen.getByTestId('file-input')
    const bigFile = createFile('big.csv', 2048)

    await userEvent.upload(input, bigFile)

    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByText(/Arquivo muito grande/)).toBeInTheDocument()
  })

  it('accepts valid file via input', async () => {
    const onFile = vi.fn()
    render(<Dropzone onFile={onFile} />)

    const input = screen.getByTestId('file-input')
    const validFile = createFile('data.csv', 100)

    await userEvent.upload(input, validFile)

    expect(onFile).toHaveBeenCalledWith(validFile)
  })

  it('accepts valid xlsx file', async () => {
    const onFile = vi.fn()
    render(<Dropzone onFile={onFile} />)

    const input = screen.getByTestId('file-input')
    const validFile = createFile('report.xlsx', 500)

    await userEvent.upload(input, validFile)

    expect(onFile).toHaveBeenCalledWith(validFile)
  })

  it('handles drag over state', () => {
    render(<Dropzone onFile={vi.fn()} />)

    const dropzone = screen.getByTestId('dropzone')

    fireEvent.dragOver(dropzone, { dataTransfer: { files: [] } })
    expect(dropzone).toHaveAttribute('data-state', 'dragover')

    fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } })
    expect(dropzone).toHaveAttribute('data-state', 'idle')
  })

  it('handles file drop', () => {
    const onFile = vi.fn()
    render(<Dropzone onFile={onFile} />)

    const dropzone = screen.getByTestId('dropzone')
    const validFile = createFile('data.xlsx', 100)

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [validFile] },
    })

    expect(onFile).toHaveBeenCalledWith(validFile)
  })

  it('rejects invalid file on drop', () => {
    const onFile = vi.fn()
    render(
      <Dropzone onFile={onFile} allowedFormats={['.csv']} />,
    )

    const dropzone = screen.getByTestId('dropzone')
    const invalidFile = createFile('data.xlsx', 100)

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [invalidFile] },
    })

    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByText(/Formato não suportado/)).toBeInTheDocument()
  })

  it('clears local error when a valid file is provided', () => {
    const onFile = vi.fn()
    render(
      <Dropzone onFile={onFile} allowedFormats={['.csv', '.xlsx']} />,
    )

    const dropzone = screen.getByTestId('dropzone')

    // First drop invalid file
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [createFile('data.pdf', 100)] },
    })
    expect(screen.getByText(/Formato não suportado/)).toBeInTheDocument()

    // Then drop valid file
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [createFile('data.csv', 100)] },
    })
    expect(screen.queryByText(/Formato não suportado/)).not.toBeInTheDocument()
    expect(onFile).toHaveBeenCalled()
  })
})
