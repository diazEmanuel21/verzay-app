'use client'

import React, { useRef, useState } from 'react'
import {
  Upload,
  Sparkles,
  Download,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  { id: 'minimalist', name: 'Minimalista', description: 'Fondos limpios, enfoque total en el producto.' },
  { id: 'premium', name: 'Premium', description: 'Iluminación de lujo, texturas de alta gama.' },
  { id: 'lifestyle', name: 'Estilo de Vida', description: 'Entornos naturales y realistas.' },
  { id: 'creative', name: 'Creativo', description: 'Composiciones artísticas y llamativas.' },
]

const AD_FORMATS = [
  { id: '1:1', name: 'Post Instagram', sub: '1080 x 1080' },
  { id: '9:16', name: 'Story / WhatsApp', sub: '1080 x 1920' },
  { id: '16:9', name: 'Post Facebook', sub: '1200 x 675' },
] as const

type AdFormat = typeof AD_FORMATS[number]['id']

const MARKETING_TEMPLATES = [
  { id: 'hero', name: '1. Hero Section', description: 'Impacto, Problema + Solución.' },
  { id: 'pain', name: '2. Identificación Dolor', description: 'Bullets emocionales.' },
  { id: 'solution', name: '3. Presentación Solución', description: 'Intro producto + Beneficios.' },
  { id: 'benefits', name: '4. Beneficios Profundos', description: 'Transformación real.' },
  { id: 'social', name: '5. Prueba Social', description: 'Testimonios y Calificaciones.' },
  { id: 'demo', name: '6. Demostración', description: 'Cómo se usa (Pasos).' },
  { id: 'objections', name: '7. Manejo Objeciones', description: 'Confianza y Garantías.' },
  { id: 'offer', name: '8. Oferta Irresistible', description: 'Descuentos y Combos.' },
  { id: 'cta', name: '9. Llamado a la Acción', description: 'Urgencia y CTA fuerte.' },
  { id: 'trust', name: '10. Sección Confianza', description: 'Sellos y Políticas.' },
]

const GENERATION_MODELS = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini Flash (Equilibrado)',
    desc: 'Rápido y versátil. Ideal para la mayoría de anuncios.',
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Pro (Alta Calidad)',
    desc: 'Máximo detalle y mejor manejo de texto. Requiere API Key propia.',
  },
  {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4 (Fotorrealismo)',
    desc: 'Especializado en texturas y realismo extremo de estudio.',
  },
]

export const AdGeneratorStudio = () => {
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
      setError('No se pudieron leer una o más imágenes.')
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
                setError('Gemini rechazó la solicitud por autenticación. Revisa la API key del servidor.')
                setIsGenerating(false)
                return
              }

              if (normalizedMessage.includes('429') || normalizedMessage.includes('quota')) {
                setError('Límite de cuota alcanzado. Se han generado algunas imágenes.')
                setIsGenerating(false)
                return
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError('Error al generar las imágenes.')
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

  const currentKey = `${isLandingKitMode ? activeTemplate : selectedTemplate}_${activeFormat}`
  const currentPreview = generatedImages[activeImageIndex]?.[currentKey]

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="rounded-2xl border-border">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                Studio IA
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Anuncios
              </Badge>
            </div>
            <div>
              <CardTitle className="text-3xl leading-tight">
                Generador de anuncios con IA
              </CardTitle>
              <CardDescription className="text-sm">
                Crea piezas visuales para campañas, posts, stories y estructuras de landing a partir de tus productos.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base">1. Imágenes del producto</CardTitle>
            <CardDescription>
              Sube una o varias imágenes para generar piezas publicitarias.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition hover:bg-muted/50"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-background border-border">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Haz clic para subir imágenes</p>
              <p className="text-xs text-muted-foreground">Puedes seleccionar varios archivos</p>
            </button>

            {sourceImages.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 pb-2">
                  {sourceImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition
                        ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                    >
                      <SafeImage
                        src={img}
                        alt={`Producto ${idx + 1}`}
                        fill
                        sizes="96px"
                        className="h-full w-full object-cover"
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
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base">2. Configuración de campaña</CardTitle>
            <CardDescription>
              Define la estructura, texto, formato y consistencia visual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Incluir texto</Label>
                  <p className="text-xs text-muted-foreground">La IA intentará integrar copies.</p>
                </div>
                <Switch checked={includeText} onCheckedChange={setIncludeText} />
              </div>

              <div className="flex items-center justify-between rounded-xl border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Kit landing</Label>
                  <p className="text-xs text-muted-foreground">Genera las 10 etapas en formato 1:1.</p>
                </div>
                <Switch checked={isLandingKitMode} onCheckedChange={setIsLandingKitMode} />
              </div>
            </div>

            {!isLandingKitMode ? (
              <div className="space-y-2">
                <Label>Estructura de marketing</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="rounded-xl">
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
                <p className="text-xs text-muted-foreground">
                  {MARKETING_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
                </p>
              </div>
            ) : (
              <Alert className="rounded-xl border-border">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Modo kit landing activado</AlertTitle>
                <AlertDescription>
                  Se generarán las 10 etapas de la landing para cada producto.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="visual-dna">ADN visual</Label>
              <Input
                id="visual-dna"
                value={visualDNA}
                onChange={(e) => setVisualDNA(e.target.value)}
                placeholder="Ej: Cocina moderna minimalista, tonos arena y madera clara..."
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Ayuda a mantener coherencia de fondo, atmósfera y ambiente.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Detalles específicos del anuncio</Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Un reloj de lujo sobre una mesa de mármol negro con iluminación dramática y reflejos dorados..."
                className="min-h-[110px] rounded-xl resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">3. Estilo visual</CardTitle>
              <CardDescription>
                Escoge o crea una identidad visual para la campaña.
              </CardDescription>
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
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence>
              {isAddingStyle && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl border-border bg-muted/20 p-4"
                >
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Nombre del estilo</Label>
                      <Input
                        value={newStyleName}
                        onChange={(e) => setNewStyleName(e.target.value)}
                        placeholder="Ej: Cyberpunk Premium"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción del estilo</Label>
                      <Textarea
                        value={newStyleDesc}
                        onChange={(e) => setNewStyleDesc(e.target.value)}
                        placeholder="Describe iluminación, fondo, atmósfera, materiales, estética..."
                        className="min-h-[90px] rounded-xl resize-none"
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

            <div className="grid gap-3 sm:grid-cols-2">
              {customStyles.map((style) => {
                const selected = selectedStyleId === style.id

                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`relative rounded-2xl border p-4 text-left transition
                      ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                    title={style.description}
                  >
                    {selected && (
                      <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
                    )}
                    <p className="pr-6 text-sm font-semibold">{style.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {style.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base">4. Motor de generación</CardTitle>
            <CardDescription>
              Selecciona el modelo de IA que procesará tus anuncios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {GENERATION_MODELS.map((model) => {
              const selected = selectedModel === model.id

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModel(model.id)}
                  className={`relative w-full rounded-2xl border p-4 text-left transition
                    ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                >
                  {selected && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
                  )}

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
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6 space-y-4">
            <Button
              type="button"
              onClick={handleGenerateAll}
              disabled={sourceImages.length === 0 || isGenerating}
              className="h-12 w-full rounded-xl text-sm font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isLandingKitMode ? 'Generar Kit de Landing Page' : 'Generar Campaña Completa'}
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="rounded-2xl min-h-[720px] border-border">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
            <div>
              <CardTitle className="text-xl">Vista previa de campaña</CardTitle>
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
                  downloadImage(
                    activeImageIndex,
                    isLandingKitMode ? activeTemplate : selectedTemplate,
                    activeFormat
                  )
                }
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {sourceImages.length > 1 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {sourceImages.map((_, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant={activeImageIndex === idx ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full shrink-0"
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      Producto {idx + 1}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}

            <Separator />

            {isLandingKitMode ? (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {MARKETING_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant={activeTemplate === template.id ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full shrink-0"
                      onClick={() => setActiveTemplate(template.id)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <Tabs
                value={activeFormat}
                onValueChange={(value) => setActiveFormat(value as AdFormat)}
                className="w-full h-full"
              >
                <TabsList className="grid w-full grid-cols-3 rounded-xl h-16">
                  {AD_FORMATS.map((format) => (
                    <TabsTrigger key={format.id} value={format.id} className="rounded-lg">
                      <div className="flex flex-col">
                        <span>{format.name}</span>
                        <span className="text-[10px] text-muted-foreground">{format.sub}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            <div
              className={`relative overflow-hidden rounded-2xl border-border bg-muted/20 flex items-center justify-center transition-all
                ${activeFormat === '9:16'
                  ? 'aspect-[9/16] max-h-[620px] mx-auto'
                  : activeFormat === '16:9'
                    ? 'aspect-[16/9]'
                    : 'aspect-square'}`}
            >
              <AnimatePresence mode="wait">
                {currentPreview ? (
                  <motion.img
                    key={`gen-${activeImageIndex}-${isLandingKitMode ? activeTemplate : selectedTemplate}-${activeFormat}`}
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
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div>
                      <p className="text-sm font-medium">Generando anuncio...</p>
                      <p className="text-xs text-muted-foreground">
                        Espera mientras la IA crea la vista actual
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 px-6 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-border bg-background">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aún no hay vista generada</p>
                      <p className="text-xs text-muted-foreground">
                        Configura la campaña y genera para ver el resultado aquí
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="rounded-2xl border-primary/10 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-primary">4.8x</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Aumento de CTR
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-primary/10 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-primary">IA</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Optimización inteligente
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
