import { RotateCcw, Play } from 'lucide-react'
import { useImporterStore } from '@/hooks/use-importer-store'

export interface ResumeSessionBannerProps {
  onResume: () => void
  onReset: () => void
}

export function ResumeSessionBanner({
  onResume,
  onReset,
}: ResumeSessionBannerProps) {
  const fileName = useImporterStore((s) => s.fileName)
  const step = useImporterStore((s) => s.step)

  // Only show if there's saved progress beyond upload
  if (!fileName || step === 'upload') return null

  return (
    <div
      className="bg-accent flex items-center justify-between rounded-lg border p-4"
      data-testid="resume-banner"
    >
      <div>
        <p className="text-sm font-medium">
          Importação anterior encontrada ({fileName}).
        </p>
        <p className="text-muted-foreground text-xs">
          Continuar de onde parou?
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="border-input bg-background hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Nova importação
        </button>
        <button
          type="button"
          onClick={onResume}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium"
        >
          <Play className="h-3.5 w-3.5" />
          Continuar
        </button>
      </div>
    </div>
  )
}
