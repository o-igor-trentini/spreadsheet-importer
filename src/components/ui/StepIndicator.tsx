import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImporterStep } from '@/types/importer'

const STEPS: { key: ImporterStep; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'mapping', label: 'Mapeamento' },
  { key: 'validation', label: 'Validação' },
  { key: 'review', label: 'Revisão' },
]

const STEP_ORDER: ImporterStep[] = ['upload', 'mapping', 'validation', 'review']

export interface StepIndicatorProps {
  currentStep: ImporterStep
  onStepClick?: (step: ImporterStep) => void
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <nav className="flex items-center gap-2" data-testid="step-indicator">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isClickable = isCompleted && onStepClick

        return (
          <div key={step.key} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  'h-px w-8',
                  isCompleted || isCurrent ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={!isClickable}
              data-testid={`step-${step.key}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isCompleted &&
                  'text-primary cursor-pointer hover:bg-accent',
                isCurrent && 'bg-primary text-primary-foreground',
                !isCompleted &&
                  !isCurrent &&
                  'text-muted-foreground cursor-default',
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                    isCurrent
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
              )}
              {step.label}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
