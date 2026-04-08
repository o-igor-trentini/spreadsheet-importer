import { useCallback, useState } from 'react'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { ResumeSessionBanner } from '@/components/ui/ResumeSessionBanner'
import { FileUpload } from '@/components/steps/FileUpload'
import { ColumnMapping } from '@/components/steps/ColumnMapping'
import { DataValidation } from '@/components/steps/DataValidation'
import { ReviewSubmit } from '@/components/steps/ReviewSubmit'
import { useImporterStore } from '@/hooks/use-importer-store'
import type { SpreadsheetImporterProps } from '@/types/importer'
import type { ImporterStep } from '@/types/importer'

type WizardShellProps = Pick<
  SpreadsheetImporterProps,
  | 'columns'
  | 'onComplete'
  | 'onCancel'
  | 'onStepChange'
  | 'allowedFormats'
  | 'maxFileSize'
  | 'previewRowCount'
>

const STEP_ORDER: ImporterStep[] = [
  'upload',
  'mapping',
  'validation',
  'review',
]

export function WizardShell({
  columns,
  onComplete,
  onCancel,
  onStepChange,
  allowedFormats,
  maxFileSize,
  previewRowCount,
}: WizardShellProps) {
  const step = useImporterStore((s) => s.step)
  const setStep = useImporterStore((s) => s.setStep)
  const reset = useImporterStore((s) => s.reset)
  const setValidationResult = useImporterStore((s) => s.setValidationResult)
  const [showResumeBanner, setShowResumeBanner] = useState(true)

  const goTo = useCallback(
    (newStep: ImporterStep) => {
      setStep(newStep)
      onStepChange?.(newStep)
    },
    [setStep, onStepChange],
  )

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx < STEP_ORDER.length - 1) {
      goTo(STEP_ORDER[idx + 1])
    }
  }, [step, goTo])

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) {
      goTo(STEP_ORDER[idx - 1])
    } else {
      onCancel?.()
    }
  }, [step, goTo, onCancel])

  const handleStepClick = useCallback(
    (clickedStep: ImporterStep) => {
      const clickedIndex = STEP_ORDER.indexOf(clickedStep)
      const currentIndex = STEP_ORDER.indexOf(step)
      if (clickedIndex < currentIndex) {
        // Clear validation result when going back before validation
        if (clickedIndex < STEP_ORDER.indexOf('validation')) {
          setValidationResult(null)
        }
        goTo(clickedStep)
      }
    },
    [step, goTo, setValidationResult],
  )

  const handleResume = useCallback(() => {
    setShowResumeBanner(false)
  }, [])

  const handleResetSession = useCallback(() => {
    reset()
    setShowResumeBanner(false)
    goTo('upload')
  }, [reset, goTo])

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} onStepClick={handleStepClick} />

      {showResumeBanner && step !== 'upload' && (
        <ResumeSessionBanner
          onResume={handleResume}
          onReset={handleResetSession}
        />
      )}

      {step === 'upload' && (
        <FileUpload
          allowedFormats={allowedFormats}
          maxFileSize={maxFileSize}
          previewRowCount={previewRowCount}
        />
      )}

      {step === 'mapping' && (
        <ColumnMapping
          columns={columns}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 'validation' && (
        <DataValidation
          columns={columns}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 'review' && (
        <ReviewSubmit
          columns={columns}
          onComplete={onComplete}
          onBack={goBack}
        />
      )}
    </div>
  )
}
