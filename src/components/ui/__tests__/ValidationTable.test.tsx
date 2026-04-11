import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ValidationTable } from '../ValidationTable'
import type { ValidationIssue } from '@/types/validation'

const issues: ValidationIssue[] = [
  { row: 1, columnKey: 'origin', severity: 'error', message: '"Origem" é obrigatório.', value: '' },
  { row: 2, columnKey: 'date', severity: 'error', message: '"Data" deve ser uma data válida.', value: 'abc' },
  { row: 3, columnKey: 'weight', severity: 'warning', message: 'Peso muito alto.', value: '49000' },
  { row: 5, columnKey: 'origin', severity: 'error', message: '"Origem" é obrigatório.', value: null },
]

describe('ValidationTable', () => {
  it('renders header labels', () => {
    render(<ValidationTable issues={issues} />)

    expect(screen.getByText('Linha')).toBeInTheDocument()
    expect(screen.getByText('Coluna')).toBeInTheDocument()
    expect(screen.getByText('Valor')).toBeInTheDocument()
    expect(screen.getByText('Severidade')).toBeInTheDocument()
    expect(screen.getByText('Mensagem')).toBeInTheDocument()
  })

  it('header is outside the scrollable area', () => {
    render(<ValidationTable issues={issues} />)

    // Find the header grid by its content
    const headerEl = screen.getByText('Linha').closest('div')!
    const scrollArea = headerEl.nextElementSibling as HTMLElement

    // Header should NOT be inside the scroll area
    expect(headerEl.className).toContain('grid')
    expect(scrollArea).not.toBeNull()
    expect(scrollArea.className).toContain('overflow-auto')

    // Header parent and scroll parent should be the same container
    expect(headerEl.parentElement).toBe(scrollArea.parentElement)
  })

  it('shows all filter buttons with correct counts', () => {
    render(<ValidationTable issues={issues} />)

    expect(screen.getByText('Todos (4)')).toBeInTheDocument()
    expect(screen.getByText('Erros (3)')).toBeInTheDocument()
    expect(screen.getByText('Avisos (1)')).toBeInTheDocument()
  })

  it('shows "Nenhum problema encontrado" when no issues', () => {
    render(<ValidationTable issues={[]} />)

    expect(screen.getByText('Nenhum problema encontrado.')).toBeInTheDocument()
  })

  it('shows column filter dropdown when multiple columns', () => {
    render(<ValidationTable issues={issues} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()

    // Should have options for each column
    const options = select.querySelectorAll('option')
    expect(options).toHaveLength(4) // all + 3 columns
  })

  it('does not show column filter when single column', () => {
    const singleColIssues: ValidationIssue[] = [
      { row: 1, columnKey: 'origin', severity: 'error', message: 'err', value: '' },
    ]

    render(<ValidationTable issues={singleColIssues} />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('highlights the active severity filter button', async () => {
    const user = userEvent.setup()
    render(<ValidationTable issues={issues} />)

    // Initially "Todos" is active
    const todosBtn = screen.getByText('Todos (4)')
    expect(todosBtn.className).toContain('bg-primary')

    // Click error filter
    const errorBtn = screen.getByText('Erros (3)')
    await user.click(errorBtn)
    expect(errorBtn.className).toContain('bg-destructive')
    expect(todosBtn.className).not.toContain('bg-primary')

    // Click warning filter
    const warnBtn = screen.getByText('Avisos (1)')
    await user.click(warnBtn)
    expect(warnBtn.className).toContain('bg-yellow')
    expect(errorBtn.className).not.toContain('bg-destructive')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ValidationTable issues={issues} className="my-class" />,
    )

    expect(container.firstChild).toHaveClass('my-class')
  })
})
