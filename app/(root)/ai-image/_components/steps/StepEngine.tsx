import { CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { GENERATION_MODELS } from '../ad-generator.constants'
import type { CustomStyle } from '../ad-generator.types'

interface StepEngineProps {
  selectedModel: string
  onSelectModel: (id: string) => void
  sourceImagesCount: number
  outputsPerImage: number
  totalOutputs: number
  includeText: boolean
  selectedStyle: CustomStyle | undefined
  customPrompt: string
}

export const StepEngine = ({
  selectedModel,
  onSelectModel,
  sourceImagesCount,
  outputsPerImage,
  totalOutputs,
  includeText,
  selectedStyle,
  customPrompt,
}: StepEngineProps) => (
  <ScrollArea className="h-full pr-2">
    <div className="flex min-h-full flex-col gap-3 pb-1">
      <div className="grid gap-3">
        {GENERATION_MODELS.map((model) => {
          const selected = selectedModel === model.id
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelectModel(model.id)}
              className={`relative w-full rounded-2xl border p-4 text-left transition ${
                selected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border/70 bg-muted/20 hover:border-primary/40'
              }`}
            >
              {selected && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />}
              <div className="mb-1 flex items-center gap-2 pr-6">
                <p className="text-sm font-semibold">{model.name}</p>
                {model.id === 'gemini-3.1-flash-image-preview' && (
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    Pro
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{model.desc}</p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Lo que se generara</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Productos</span>
              <span className="font-semibold">{sourceImagesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Salidas por producto</span>
              <span className="font-semibold">{outputsPerImage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total estimado</span>
              <span className="font-semibold">{totalOutputs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Texto en imagen</span>
              <span className="font-semibold">{includeText ? 'Si' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Direccion actual</p>
          <p className="mt-2 text-sm font-semibold">{selectedStyle?.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{selectedStyle?.description}</p>
          <Separator className="my-3" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Prompt base</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {customPrompt.trim() || 'Sin instrucciones extra. Se usara la plantilla y estilo seleccionados.'}
          </p>
        </div>
      </div>
    </div>
  </ScrollArea>
)
