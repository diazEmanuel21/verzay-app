'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  Upload,
  Sparkles,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  LayoutTemplate,
  Palette,
  Cpu,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { generateAdImage } from '@/actions/ai-image-actions'

import { SafeImage } from '@/components/custom/SafeImage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface CustomStyle {
  id: string
  name: string
  description: string
}

const DEFAULT_STYLES: CustomStyle[] = [
  { id: 'minimalist', name: 'Minimalista', description: 'Fondos limpios y enfoque total en el producto.' },
  { id: 'premium', name: 'Premium', description: 'Iluminacion de lujo y texturas de alta gama.' },
  { id: 'lifestyle', name: 'Estilo de Vida', description: 'Entornos naturales y realistas.' },
  { id: 'creative', name: 'Creativo', description: 'Composiciones artisticas y llamativas.' },
]

const AD_FORMATS = [
  { id: '1:1', name: 'Post Instagram', sub: '1080 x 1080' },
  { id: '9:16', name: 'Story / WhatsApp', sub: '1080 x 1920' },
  { id: '16:9', name: 'Post Facebook', sub: '1200 x 675' },
] as const

type AdFormat = typeof AD_FORMATS[number]['id']
type StudioStepId = 'images' | 'campaign' | 'style' | 'engine'

const MARKETING_TEMPLATES = [
  { id: 'hero', name: '1. Hero Section', description: 'Impacto, problema y solucion.' },
  { id: 'pain', name: '2. Identificacion Dolor', description: 'Bullets emocionales.' },
  { id: 'solution', name: '3. Presentacion Solucion', description: 'Intro producto y beneficios.' },
  { id: 'benefits', name: '4. Beneficios Profundos', description: 'Transformacion real.' },
  { id: 'social', name: '5. Prueba Social', description: 'Testimonios y calificaciones.' },
  { id: 'demo', name: '6. Demostracion', description: 'Como se usa en pasos.' },
  { id: 'objections', name: '7. Manejo Objeciones', description: 'Confianza y garantias.' },
  { id: 'offer', name: '8. Oferta Irresistible', description: 'Descuentos y combos.' },
  { id: 'cta', name: '9. Llamado a la Accion', description: 'Urgencia y CTA fuerte.' },
  { id: 'trust', name: '10. Seccion Confianza', description: 'Sellos y politicas.' },
]

const GENERATION_MODELS = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini Flash (Equilibrado)',
    desc: 'Rapido y versatil. Ideal para la mayoria de anuncios.',
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Pro (Alta Calidad)',
    desc: 'Maximo detalle y mejor manejo de texto. Requiere API Key propia.',
  },
  {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4 (Fotorrealismo)',
    desc: 'Especializado en texturas y realismo de estudio.',
  },
]

const STUDIO_STEPS: Array<{
  id: StudioStepId
  label: string
  helper: string
  icon: LucideIcon
}> = [
    { id: 'images', label: 'Producto', helper: 'Sube las referencias base.', icon: Upload },
    { id: 'campaign', label: 'imagen', helper: 'Define estructura y mensaje.', icon: LayoutTemplate },
    { id: 'style', label: 'Estilo', helper: 'Elige la direccion visual.', icon: Palette },
    { id: 'engine', label: 'Motor', helper: 'Selecciona el modelo IA.', icon: Cpu },
  ]

export const AdGeneratorStudio = () => {
  const [activeStep, setActiveStep] = useState<StudioStepId>('images')
  const [sourceImages, setSourceImages] = useState<string[]>([])
  const [generatedImages, setGeneratedImages] = useState<Record<number, Record<string, string>>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLandingKitMode, setIsLandingKitMode] = useState(false)
  const [includeText, setIncludeText] = useState(false)
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>(DEFAULT_STYLES)
  const [selectedStyleId, setSelectedStyleId] = useState(DEFAULT_STYLES[0].id)
  const [selectedTemplate, setSelectedTemplate] = useState(MARKETING_TEMPLATES[0].id)
  const [selectedModel, setSelectedModel] = useState(GENERATION_MODELS[0].id)
  const [customPrompt, setCustomPrompt] = useState('')
  const [visualDNA, setVisualDNA] = useState('')
  const [activeFormat, setActiveFormat] = useState<AdFormat>('1:1')
  const [activeTemplate, setActiveTemplate] = useState<string>(MARKETING_TEMPLATES[0].id)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isAddingStyle, setIsAddingStyle] = useState(false)
  const [newStyleName, setNewStyleName] = useState('')
  const [newStyleDesc, setNewStyleDesc] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedStyle = useMemo(
    () => customStyles.find((style) => style.id === selectedStyleId) ?? customStyles[0],
    [customStyles, selectedStyleId]
  )
  const selectedTemplateMeta = useMemo(
    () => MARKETING_TEMPLATES.find((template) => template.id === selectedTemplate) ?? MARKETING_TEMPLATES[0],
    [selectedTemplate]
  )
  const selectedModelMeta = useMemo(
    () => GENERATION_MODELS.find((model) => model.id === selectedModel) ?? GENERATION_MODELS[0],
    [selectedModel]
  )

  const outputsPerImage = isLandingKitMode ? MARKETING_TEMPLATES.length : AD_FORMATS.length
  const totalOutputs = sourceImages.length * outputsPerImage
  const currentStepIndex = STUDIO_STEPS.findIndex((step) => step.id === activeStep)
  const currentStepMeta = STUDIO_STEPS[currentStepIndex] ?? STUDIO_STEPS[0]
  const isLastStep = currentStepIndex === STUDIO_STEPS.length - 1
  const currentSourceImage = sourceImages[activeImageIndex]

  const stepCompletion: Record<StudioStepId, boolean> = {
    images: sourceImages.length > 0,
    campaign:
      Boolean(isLandingKitMode || selectedTemplate) &&
      Boolean(customPrompt.trim() || visualDNA.trim() || includeText || isLandingKitMode),
    style: Boolean(selectedStyleId),
    engine: Boolean(selectedModel),
  }

  const canMoveForward = activeStep !== 'images' || sourceImages.length > 0
  const canGenerate = sourceImages.length > 0 && !isGenerating

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    try {
      const fileList = Array.from(files)
      const base64Images = await Promise.all(
        fileList.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
        )
      )

      setSourceImages((prev) => [...prev, ...base64Images])
      setError(null)

    } catch {
      setError('No se pudieron leer una o mas imagenes.')
    }
  }

  const removeImage = (index: number) => {
    setSourceImages((prev) => {
      const next = prev.filter((_, i) => i !== index)

      setActiveImageIndex((current) => {
        if (next.length === 0) return 0
        if (current > index) return current - 1
        if (current >= next.length) return next.length - 1
        return current
      })

      return next
    })

    setGeneratedImages((prev) => {
      const next: Record<number, Record<string, string>> = {}

      Object.entries(prev).forEach(([key, value]) => {
        const imageIndex = Number(key)

        if (imageIndex < index) {
          next[imageIndex] = value
          return
        }

        if (imageIndex > index) {
          next[imageIndex - 1] = value
        }
      })

      return next
    })
  }

  const addCustomStyle = () => {
    if (!newStyleName.trim() || !newStyleDesc.trim()) return

    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name: newStyleName.trim(),
      description: newStyleDesc.trim(),
    }

    setCustomStyles((prev) => [...prev, newStyle])
    setSelectedStyleId(newStyle.id)
    setNewStyleName('')
    setNewStyleDesc('')
    setIsAddingStyle(false)
  }

  const handleGenerateAll = async () => {
    if (sourceImages.length === 0) return

    setIsGenerating(true)
    setError(null)

    const style = customStyles.find((s) => s.id === selectedStyleId)?.description || ''
    const batchSeed = Math.floor(Math.random() * 1000000)

    try {
      const newGenerated = { ...generatedImages }

      for (let i = 0; i < sourceImages.length; i++) {
        if (!newGenerated[i]) newGenerated[i] = {}

        const templatesToGen = isLandingKitMode ? MARKETING_TEMPLATES.map((t) => t.id) : [selectedTemplate]
        const formatsToGen = isLandingKitMode ? ['1:1'] : AD_FORMATS.map((f) => f.id)

        for (const templateId of templatesToGen) {
          for (const formatId of formatsToGen as AdFormat[]) {
            const key = `${templateId}_${formatId}`
            await new Promise((resolve) => setTimeout(resolve, 1500))

            try {
              const result = await generateAdImage(
                sourceImages[i],
                style,
                customPrompt,
                templateId,
                formatId,
                batchSeed,
                visualDNA,
                includeText,
                selectedModel
              )

              newGenerated[i][key] = result
              setGeneratedImages({ ...newGenerated })
            } catch (err: any) {
              console.error(`Error generating image ${i} key ${key}:`, err)

              const message = String(err?.message || '')
              const normalizedMessage = message.toLowerCase()

              if (normalizedMessage.includes('falta la api key de gemini')) {
                setError('Falta configurar la API key de Gemini en el servidor (.env).')
                setIsGenerating(false)
                return
              }

              if (
                normalizedMessage.includes('permission_denied') ||
                normalizedMessage.includes('unregistered callers') ||
                normalizedMessage.includes('api key should be set')
              ) {
                setError('Gemini rechazo la solicitud por autenticacion. Revisa la API key del servidor.')
                setIsGenerating(false)
                return
              }

              if (normalizedMessage.includes('429') || normalizedMessage.includes('quota')) {
                setError('Limite de cuota alcanzado. Se generaron algunas imagenes.')
                setIsGenerating(false)
                return
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError('Error al generar las imagenes.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (imageIndex: number, templateId: string, formatId: AdFormat) => {
    const key = `${templateId}_${formatId}`
    const img = generatedImages[imageIndex]?.[key]
    if (!img) return

    const link = document.createElement('a')
    link.href = img
    link.download = `ad-${imageIndex}-${templateId}-${formatId.replace(':', 'x')}.png`
    link.click()
  }

  const goToPreviousStep = () => {
    if (currentStepIndex <= 0) return
    setActiveStep(STUDIO_STEPS[currentStepIndex - 1].id)
  }

  const goToNextStep = () => {
    if (!canMoveForward || isLastStep) return
    setActiveStep(STUDIO_STEPS[currentStepIndex + 1].id)
  }

  const previewFormat: AdFormat = isLandingKitMode ? '1:1' : activeFormat
  const currentKey = `${isLandingKitMode ? activeTemplate : selectedTemplate}_${previewFormat}`
  const currentPreview = generatedImages[activeImageIndex]?.[currentKey]

  return (
    <div className="grid min-h-full content-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-start">
      <Card className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border-border shadow-sm">
        <CardHeader className="space-y-3 border-b bg-gradient-to-b from-muted/40 to-background p-4 lg:p-5">
          <div className="space-y-0">
            <CardTitle className="text-2xl leading-tight lg:text-3xl">Generador de imagenes</CardTitle>
          </div>

          {/* <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Activos</p>
              <p className="mt-1 text-lg font-semibold">{sourceImages.length}</p>
              <p className="text-xs text-muted-foreground">Productos cargados</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Salidas</p>
              <p className="mt-1 text-lg font-semibold">{totalOutputs}</p>
              <p className="text-xs text-muted-foreground">Variantes estimadas</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modo</p>
              <p className="mt-1 text-sm font-semibold">{isLandingKitMode ? 'Kit Landing' : 'imagen Multi-formato'}</p>
              <p className="text-xs text-muted-foreground">{selectedModelMeta.name}</p>
            </div>
          </div> */}
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <Tabs value={activeStep} className="flex h-full min-h-0 flex-col">
            <div className="border-b px-4 py-3">
              <div className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 lg:grid-cols-4">
                {STUDIO_STEPS.map((step, index) => {
                  const StepIcon = step.icon
                  const isCompleted = stepCompletion[step.id]
                  const isActive = activeStep === step.id

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={`h-auto rounded-2xl border px-3 py-3 text-left transition ${isActive
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/70 bg-muted/20 hover:border-primary/40'
                        }`}
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background">
                          <span className="text-xs font-semibold">{index + 1}</span>
                        </div>

                        <div className="flex gap-2 h-9 flex-1 items-center">
                          <StepIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{step.label}</span>
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        {/* <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{step.helper}</p> */}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* <div className="grid grid-cols-3 gap-2 border-b px-4 py-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Plantilla</p>
                <p className="mt-1 text-sm font-semibold">{isLandingKitMode ? '10 etapas landing' : selectedTemplateMeta.name}</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Estilo</p>
                <p className="mt-1 text-sm font-semibold">{selectedStyle?.name}</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Motor</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold">{selectedModelMeta.name}</p>
              </div>
            </div> */}
            <div className="min-h-0 flex-1 px-4 py-3">
              <TabsContent value="images" className="mt-0 h-full data-[state=inactive]:hidden">
                <ScrollArea className="h-full pr-2">
                  <div className="flex min-h-full flex-col gap-3 pb-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />



                    <div className="relative min-h-[180px] overflow-hidden rounded-3xl border border-border/70 bg-muted/20 sm:min-h-[200px]">
                      {currentSourceImage ? (
                        <>
                          <SafeImage
                            src={currentSourceImage}
                            alt={`Producto ${activeImageIndex + 1}`}
                            fill
                            sizes="460px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />

                          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full">Producto {activeImageIndex + 1}</Badge>
                            <Badge variant="outline" className="rounded-full bg-background/90">
                              {sourceImages.length} cargadas
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-background">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Todavia no hay referencias cargadas</p>
                            <p className="text-xs text-muted-foreground">
                              La imagen seleccionada aqui sera la base del preview y de la generacion.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-[108px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-5 text-center transition hover:bg-muted/50"
                    >
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border bg-background">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Haz clic para subir imagenes</p>
                      <p className="text-xs text-muted-foreground">{`${STUDIO_STEPS[0].helper} Idealmente 1 a 4 angulos del producto`}</p>
                    </button>

                    {sourceImages.length > 0 ? (
                      <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-3 pb-2">
                          {sourceImages.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => setActiveImageIndex(idx)}
                              className={`relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border transition ${activeImageIndex === idx
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/40'
                                }`}
                            >
                              <SafeImage
                                src={img}
                                alt={`Producto ${idx + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="absolute right-1 top-1 h-6 w-6 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeImage(idx)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    ) : (
                      <Alert className="rounded-2xl border-border/70">
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>Recomendacion</AlertTitle>
                        <AlertDescription>
                          Sube una imagen limpia del producto primero. Luego puedes anadir mas angulos para generar la
                          misma imagen en lote.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="campaign" className="mt-0 h-full data-[state=inactive]:hidden">
                <ScrollArea className="h-full pr-2">
                  <div className="flex min-h-full flex-col gap-3 pb-1">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Texto</Label>
                            <p className="text-sm font-medium">Incluir copy en la imagen</p>
                            {/* <p className="text-xs text-muted-foreground">La IA intentara integrar titulares o mensajes.</p> */}
                          </div>
                          <Switch checked={includeText} onCheckedChange={setIncludeText} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modo</Label>
                            <p className="text-sm font-medium">Genera las 10 etapas</p>
                            {/* <p className="text-xs text-muted-foreground">Genera las 10 etapas en formato 1:1.</p> */}
                          </div>
                          <Switch checked={isLandingKitMode} onCheckedChange={setIsLandingKitMode} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      {!isLandingKitMode ? (
                        <div className="space-y-2">
                          <Label>Estructura de marketing</Label>
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger className="rounded-xl bg-background">
                              <SelectValue placeholder="Selecciona una estructura" />
                            </SelectTrigger>
                            <SelectContent>
                              {MARKETING_TEMPLATES.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">{selectedTemplateMeta.description}</p>
                        </div>
                      ) : (
                        <Alert className="rounded-2xl border-border bg-background/80">
                          <Sparkles className="h-4 w-4" />
                          <AlertTitle>Modo kit landing activado</AlertTitle>
                          <AlertDescription>
                            Se generaran las 10 etapas de la landing para cada producto con una narrativa completa.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="visual-dna">ADN visual</Label>
                        <Input
                          id="visual-dna"
                          value={visualDNA}
                          onChange={(e) => setVisualDNA(e.target.value)}
                          placeholder="Define fondo, ambiente, iluminacion y sensacion general de la imagen."
                          className="rounded-xl bg-background"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <Label htmlFor="custom-prompt">Detalles especificos del anuncio</Label>
                      <Textarea
                        id="custom-prompt"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Describe la escena final, la intencion comercial o cualquier detalle que no deba improvisar la IA.
                        Ej: Un reloj de lujo sobre una mesa de marmol negro con iluminacion dramatica..."
                        className="mt-2 min-h-[180px] rounded-xl resize-none bg-background"
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="style" className="mt-0 h-full data-[state=inactive]:hidden">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Biblioteca visual</p>
                      <p className="text-xs text-muted-foreground">
                        Elige un look & feel existente o crea un estilo propio para esta imagen.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setIsAddingStyle((prev) => !prev)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Crear estilo
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isAddingStyle && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20"
                      >
                        <div className="space-y-3 p-4">
                          <div className="space-y-2">
                            <Label>Nombre del estilo</Label>
                            <Input
                              value={newStyleName}
                              onChange={(e) => setNewStyleName(e.target.value)}
                              placeholder="Ej: Cyberpunk Premium"
                              className="rounded-xl bg-background"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Descripcion del estilo</Label>
                            <Textarea
                              value={newStyleDesc}
                              onChange={(e) => setNewStyleDesc(e.target.value)}
                              placeholder="Describe iluminacion, fondo, atmosfera, materiales y estetica..."
                              className="min-h-[96px] rounded-xl resize-none bg-background"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button type="button" onClick={addCustomStyle} className="rounded-xl">
                              Guardar estilo
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddingStyle(false)}
                              className="rounded-xl"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ScrollArea className="min-h-0 flex-1 pr-2">
                    <div className="grid gap-3 pb-2 sm:grid-cols-2">
                      {customStyles.map((style) => {
                        const selected = selectedStyleId === style.id

                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setSelectedStyleId(style.id)}
                            className={`relative rounded-2xl border p-4 text-left transition ${selected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/70 bg-muted/20 hover:border-primary/40'
                              }`}
                            title={style.description}
                          >
                            {selected && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />}
                            <p className="pr-6 text-sm font-semibold">{style.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{style.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="engine" className="mt-0 h-full data-[state=inactive]:hidden">
                <ScrollArea className="h-full pr-2">
                  <div className="flex min-h-full flex-col gap-3 pb-1">
                    <div className="grid gap-3">
                      {GENERATION_MODELS.map((model) => {
                        const selected = selectedModel === model.id

                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => setSelectedModel(model.id)}
                            className={`relative w-full rounded-2xl border p-4 text-left transition ${selected
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
                            <span className="font-semibold">{sourceImages.length}</span>
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
              </TabsContent>
            </div>
            <div className="border-t px-4 py-3">
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Paso {currentStepIndex + 1} de {STUDIO_STEPS.length}
                  </p>
                  <div className="flex flex-row justify-center gap-1 items-center">
                    <p className="truncate text-sm font-semibold">{currentStepMeta.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{currentStepMeta.helper}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={goToPreviousStep}
                    disabled={currentStepIndex === 0 || isGenerating}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>

                  {isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleGenerateAll}
                      disabled={!canGenerate}
                      className="rounded-xl px-5"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {isLandingKitMode ? 'Generar kit' : 'Generar imagen'}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!canMoveForward || isGenerating}
                      className="rounded-xl px-5"
                    >
                      Siguiente
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border-border shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b bg-background/95 p-4 lg:flex-row lg:items-start lg:justify-between lg:p-5">
          <div className="space-y-1">
            <CardTitle className="text-xl">Vista previa de imagenes</CardTitle>
            <CardDescription>
              Producto {sourceImages.length ? activeImageIndex + 1 : 0} de {sourceImages.length}
            </CardDescription>
          </div>

          {currentPreview && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() =>
                downloadImage(activeImageIndex, isLandingKitMode ? activeTemplate : selectedTemplate, previewFormat)
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-4 lg:p-5">
          {sourceImages.length > 1 && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {sourceImages.map((_, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={activeImageIndex === idx ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => setActiveImageIndex(idx)}
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
                    onClick={() => setActiveTemplate(template.id)}
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
                  onClick={() => setActiveFormat(format.id)}
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
                      {sourceImages.length === 0 ? 'Carga una imagen base para iniciar' : 'Aun no hay vista generada'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sourceImages.length === 0
                        ? 'Sube el producto en el paso 1 y luego ajusta la imagen.'
                        : 'Configura el flujo y genera para ver el resultado aqui.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* <div className="grid gap-3 sm:grid-cols-2">
            <Card className="rounded-2xl border-primary/10 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-2xl font-bold text-primary">{isLandingKitMode ? '10x' : `${AD_FORMATS.length}x`}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cobertura visual por producto</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-primary/10 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-2xl font-bold text-primary">{selectedStyle?.name ?? 'IA'}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Direccion visual activa</p>
              </CardContent>
            </Card>
          </div> */}
        </CardContent>
      </Card>
    </div>
  )
}
