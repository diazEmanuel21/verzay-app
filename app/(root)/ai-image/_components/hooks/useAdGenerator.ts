'use client'

import { useMemo, useRef, useState } from 'react'
import { generateAdImage } from '@/actions/ai-image-actions'
import {
  AD_FORMATS,
  DEFAULT_STYLES,
  GENERATION_MODELS,
  MARKETING_TEMPLATES,
  STUDIO_STEPS,
} from '../ad-generator.constants'
import type { AdFormat, CustomStyle, StudioStepId } from '../ad-generator.types'

export const useAdGenerator = () => {
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

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedStyle = useMemo(
    () => customStyles.find((s) => s.id === selectedStyleId) ?? customStyles[0],
    [customStyles, selectedStyleId]
  )

  const selectedTemplateMeta = useMemo(
    () => MARKETING_TEMPLATES.find((t) => t.id === selectedTemplate) ?? MARKETING_TEMPLATES[0],
    [selectedTemplate]
  )

  const selectedModelMeta = useMemo(
    () => GENERATION_MODELS.find((m) => m.id === selectedModel) ?? GENERATION_MODELS[0],
    [selectedModel]
  )

  const outputsPerImage = isLandingKitMode ? MARKETING_TEMPLATES.length : AD_FORMATS.length
  const totalOutputs = sourceImages.length * outputsPerImage
  const currentStepIndex = STUDIO_STEPS.findIndex((s) => s.id === activeStep)
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

  const previewFormat: AdFormat = isLandingKitMode ? '1:1' : activeFormat
  const currentKey = `${isLandingKitMode ? activeTemplate : selectedTemplate}_${previewFormat}`
  const currentPreview = generatedImages[activeImageIndex]?.[currentKey]

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    try {
      const base64Images = await Promise.all(
        Array.from(files).map(
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
        if (imageIndex < index) { next[imageIndex] = value; return }
        if (imageIndex > index) { next[imageIndex - 1] = value }
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

    const styleDesc = customStyles.find((s) => s.id === selectedStyleId)?.description ?? ''
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
                styleDesc,
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
            } catch (err: unknown) {
              console.error(`Error generating image ${i} key ${key}:`, err)
              const message = String((err as Error)?.message ?? '').toLowerCase()

              if (message.includes('falta la api key de gemini')) {
                setError('Falta configurar la API key de Gemini en el servidor (.env).')
                setIsGenerating(false)
                return
              }
              if (
                message.includes('permission_denied') ||
                message.includes('unregistered callers') ||
                message.includes('api key should be set')
              ) {
                setError('Gemini rechazo la solicitud por autenticacion. Revisa la API key del servidor.')
                setIsGenerating(false)
                return
              }
              if (message.includes('429') || message.includes('quota')) {
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

  return {
    // State
    activeStep, setActiveStep,
    sourceImages,
    generatedImages,
    isGenerating,
    isLandingKitMode, setIsLandingKitMode,
    includeText, setIncludeText,
    customStyles,
    selectedStyleId, setSelectedStyleId,
    selectedTemplate, setSelectedTemplate,
    selectedModel, setSelectedModel,
    customPrompt, setCustomPrompt,
    visualDNA, setVisualDNA,
    activeFormat, setActiveFormat,
    activeTemplate, setActiveTemplate,
    activeImageIndex, setActiveImageIndex,
    error,
    isAddingStyle, setIsAddingStyle,
    newStyleName, setNewStyleName,
    newStyleDesc, setNewStyleDesc,
    fileInputRef,
    // Derived
    selectedStyle,
    selectedTemplateMeta,
    selectedModelMeta,
    outputsPerImage,
    totalOutputs,
    currentStepIndex,
    currentStepMeta,
    isLastStep,
    currentSourceImage,
    stepCompletion,
    canMoveForward,
    canGenerate,
    previewFormat,
    currentPreview,
    // Handlers
    handleImageUpload,
    removeImage,
    addCustomStyle,
    handleGenerateAll,
    downloadImage,
    goToPreviousStep,
    goToNextStep,
  }
}
