import { Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { AD_FORMATS, MARKETING_TEMPLATES } from './ad-generator.constants'
import type { AdFormat } from './ad-generator.types'

interface AdPreviewPanelProps {
  sourceImagesCount: number
  activeImageIndex: number
  onSelectImage: (index: number) => void
  isLandingKitMode: boolean
  activeTemplate: string
  onSelectTemplate: (id: string) => void
  activeFormat: AdFormat
  onSelectFormat: (format: AdFormat) => void
  previewFormat: AdFormat
  currentPreview: string | undefined
  isGenerating: boolean
  selectedTemplate: string
  onDownload: (imageIndex: number, templateId: string, formatId: AdFormat) => void
}

export const AdPreviewPanel = ({
  sourceImagesCount,
  activeImageIndex,
  onSelectImage,
  isLandingKitMode,
  activeTemplate,
  onSelectTemplate,
  activeFormat,
  onSelectFormat,
  previewFormat,
  currentPreview,
  isGenerating,
  selectedTemplate,
  onDownload,
}: AdPreviewPanelProps) => (
  <Card className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border-border shadow-sm">
    <CardHeader className="flex flex-col gap-3 border-b bg-background/95 p-4 lg:flex-row lg:items-start lg:justify-between lg:p-5">
      <CardTitle className="text-2xl leading-tight lg:text-3xl">Vista previa de imagenes</CardTitle>
      {currentPreview && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={() =>
            onDownload(
              activeImageIndex,
              isLandingKitMode ? activeTemplate : selectedTemplate,
              previewFormat
            )
          }
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </CardHeader>

    <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-4 lg:p-5">
      {sourceImagesCount > 1 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {Array.from({ length: sourceImagesCount }, (_, idx) => (
              <Button
                key={idx}
                type="button"
                variant={activeImageIndex === idx ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => onSelectImage(idx)}
              >
                Producto {idx + 1}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {isLandingKitMode ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {MARKETING_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                type="button"
                variant={activeTemplate === template.id ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => onSelectTemplate(template.id)}
              >
                {template.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="grid h-18 w-full grid-cols-3 gap-2">
          {AD_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => onSelectFormat(format.id)}
              className={`rounded-2xl border px-3 py-2 text-center transition ${activeFormat === format.id
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border/70 bg-muted/20 hover:border-primary/40'
                }`}
            >
              <div className="flex flex-col">
                <span>{format.name}</span>
                <span className="text-[10px] text-muted-foreground">{format.sub}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        className={`relative flex min-h-[180px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-border/70 bg-muted/20 transition-all sm:min-h-[220px] ${previewFormat === '9:16'
          ? 'mx-auto aspect-[9/16] max-h-[620px]'
          : previewFormat === '16:9'
            ? 'aspect-[16/9]'
            : 'aspect-square'
          }`}
      >
        <AnimatePresence mode="wait">
          {currentPreview ? (
            <motion.img
              key={`gen-${activeImageIndex}-${isLandingKitMode ? activeTemplate : selectedTemplate}-${previewFormat}`}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              src={currentPreview}
              alt="Resultado generado"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 px-6 text-center"
            >
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Generando anuncio...</p>
                <p className="text-xs text-muted-foreground">Espera mientras la IA construye la vista actual.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 px-6 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-background">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {sourceImagesCount === 0 ? 'Carga una imagen base para iniciar' : 'Aun no hay vista generada'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sourceImagesCount === 0
                    ? 'Sube el producto en el paso 1 y luego ajusta la imagen.'
                    : 'Configura el flujo y genera para ver el resultado aqui.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CardContent>
  </Card>
)
