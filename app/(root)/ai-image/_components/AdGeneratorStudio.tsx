'use client'

import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Download, RefreshCw, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAdImage } from '@/actions/ai-image-actions';

interface CustomStyle {
  id: string;
  name: string;
  description: string;
}

const DEFAULT_STYLES: CustomStyle[] = [
  { id: 'minimalist', name: 'Minimalista', description: 'Fondos limpios, enfoque total en el producto.' },
  { id: 'premium', name: 'Premium', description: 'Iluminación de lujo, texturas de alta gama.' },
  { id: 'lifestyle', name: 'Estilo de Vida', description: 'Entornos naturales y realistas.' },
  { id: 'creative', name: 'Creativo', description: 'Composiciones artísticas y llamativas.' },
];

const AD_FORMATS = [
  { id: '1:1', name: 'Post Instagram', sub: '1080 x 1080' },
  { id: '9:16', name: 'Story / WhatsApp', sub: '1080 x 1920' },
  { id: '16:9', name: 'Post Facebook', sub: '1200 x 675' },
] as const;

type AdFormat = typeof AD_FORMATS[number]['id'];

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
];

const GENERATION_MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Gemini Flash (Equilibrado)', desc: 'Rápido y versátil. Ideal para la mayoría de anuncios.' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Pro (Alta Calidad)', desc: 'Máximo detalle y mejor manejo de texto. Requiere API Key propia.' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4 (Fotorrealismo)', desc: 'Especializado en texturas y realismo extremo de estudio.' },
];

export const AdGeneratorStudio = () => {
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<number, Record<string, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLandingKitMode, setIsLandingKitMode] = useState(false);
  const [includeText, setIncludeText] = useState(false);
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>(DEFAULT_STYLES);
  const [selectedStyleId, setSelectedStyleId] = useState(DEFAULT_STYLES[0].id);
  const [selectedTemplate, setSelectedTemplate] = useState(MARKETING_TEMPLATES[0].id);
  const [selectedModel, setSelectedModel] = useState(GENERATION_MODELS[0].id);
  const [customPrompt, setCustomPrompt] = useState('');
  const [visualDNA, setVisualDNA] = useState('');
  const [activeFormat, setActiveFormat] = useState<AdFormat>('1:1');
  const [activeTemplate, setActiveTemplate] = useState<string>(MARKETING_TEMPLATES[0].id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleDesc, setNewStyleDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSourceImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setSourceImages(prev => prev.filter((_, i) => i !== index));
    if (activeImageIndex >= sourceImages.length - 1 && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };

  const addCustomStyle = () => {
    if (!newStyleName || !newStyleDesc) return;
    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name: newStyleName,
      description: newStyleDesc
    };
    setCustomStyles(prev => [...prev, newStyle]);
    setSelectedStyleId(newStyle.id);
    setNewStyleName('');
    setNewStyleDesc('');
    setIsAddingStyle(false);
  };

  const handleGenerateAll = async () => {
    if (sourceImages.length === 0) return;

    setIsGenerating(true);
    setError(null);

    const style = customStyles.find(s => s.id === selectedStyleId)?.description || '';
    const batchSeed = Math.floor(Math.random() * 1000000);

    try {
      const newGenerated = { ...generatedImages };

      for (let i = 0; i < sourceImages.length; i++) {
        if (!newGenerated[i]) newGenerated[i] = {};

        const templatesToGen = isLandingKitMode ? MARKETING_TEMPLATES.map(t => t.id) : [selectedTemplate];
        const formatsToGen = isLandingKitMode ? ['1:1'] : AD_FORMATS.map(f => f.id);

        for (const templateId of templatesToGen) {
          for (const formatId of formatsToGen as AdFormat[]) {
            const key = `${templateId}_${formatId}`;

            await new Promise(resolve => setTimeout(resolve, 1500));

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
              );
              newGenerated[i][key] = result;
              setGeneratedImages({ ...newGenerated });
            } catch (err: any) {
              console.error(`Error generating image ${i} key ${key}:`, err);
              const message = String(err?.message || '');
              const normalizedMessage = message.toLowerCase();

              if (normalizedMessage.includes('falta la api key de gemini')) {
                setError('Falta configurar la API key de Gemini en el servidor (.env).');
                setIsGenerating(false);
                return;
              }

              if (
                normalizedMessage.includes('permission_denied') ||
                normalizedMessage.includes('unregistered callers') ||
                normalizedMessage.includes('api key should be set')
              ) {
                setError('Gemini rechazó la solicitud por autenticación. Revisa la API key del servidor.');
                setIsGenerating(false);
                return;
              }

              if (normalizedMessage.includes('429') || normalizedMessage.includes('quota')) {
                setError(`Límite de cuota alcanzado. Se han generado algunas imágenes.`);
                setIsGenerating(false);
                return;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error al generar las imágenes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageIndex: number, templateId: string, formatId: AdFormat) => {
    const key = `${templateId}_${formatId}`;
    const img = generatedImages[imageIndex]?.[key];
    if (!img) return;
    const link = document.createElement('a');
    link.href = img;
    link.download = `ad-${imageIndex}-${templateId}-${formatId.replace(':', 'x')}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">AdGen AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-black/60">
            <a href="#" className="hover:text-black transition-colors">Plantillas</a>
            <a href="#" className="hover:text-black transition-colors">Galería</a>
            <a href="#" className="hover:text-black transition-colors">Precios</a>
          </nav>
          <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/80 transition-all active:scale-95">
            Empezar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left Column: Controls */}
          <div className="space-y-10">
            <section>
              <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-4">
                Generador de <br />
                <span className="text-indigo-600">Anuncios de Producto</span>
              </h1>
              <p className="text-black/60 text-lg max-w-md">
                Crea imágenes publicitarias de alta conversión para cualquier producto en segundos.
              </p>
            </section>

            {/* Upload Area */}
            <section className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">1. Sube las Fotos de los Productos</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center p-8 border-black/10 hover:border-indigo-400 hover:bg-indigo-50/10"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="text-black/40 w-6 h-6" />
                </div>
                <p className="font-medium text-sm">Haz clic para subir imágenes</p>
                <p className="text-xs text-black/40 mt-1">Puedes seleccionar varios archivos</p>
              </div>

              {sourceImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {sourceImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer
                        ${activeImageIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent hover:border-black/10'}`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Marketing Template */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40">2. Estructura de Marketing</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600">INCLUIR TEXTO</span>
                    <button
                      onClick={() => setIncludeText(!includeText)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${includeText ? 'bg-indigo-600' : 'bg-black/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeText ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600">KIT LANDING</span>
                    <button
                      onClick={() => setIsLandingKitMode(!isLandingKitMode)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${isLandingKitMode ? 'bg-indigo-600' : 'bg-black/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isLandingKitMode ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {!isLandingKitMode ? (
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-black/5 focus:border-indigo-500 outline-none bg-white text-sm font-medium"
                  >
                    {MARKETING_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name} - {t.description}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Modo Kit Activado: Se generarán **las 10 etapas** de la landing page para cada producto.
                  </p>
                </div>
              )}
            </section>

            {/* Visual DNA */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40">3. ADN Visual (Consistencia)</label>
                <span className="text-[10px] text-indigo-600 font-bold">MANTIENE EL MISMO FONDO</span>
              </div>
              <input
                type="text"
                value={visualDNA}
                onChange={(e) => setVisualDNA(e.target.value)}
                placeholder="Ej: Cocina moderna minimalista, tonos arena y madera clara..."
                className="w-full p-4 rounded-2xl border-2 border-black/5 focus:border-indigo-500 outline-none text-sm"
              />
            </section>

            {/* Custom Prompt */}
            <section className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">4. Detalles Específicos del Anuncio</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Un reloj de lujo sobre una mesa de mármol negro con iluminación dramática y reflejos dorados..."
                className="w-full p-4 rounded-2xl border-2 border-black/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-h-[100px] resize-none text-sm leading-relaxed"
              />
            </section>

            {/* Style Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40">5. Elige el Estilo Visual</label>
                <button
                  onClick={() => setIsAddingStyle(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Crear Estilo
                </button>
              </div>

              <AnimatePresence>
                {isAddingStyle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3 mb-4 overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Nombre del estilo (ej: Cyberpunk)"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-black/5 text-sm outline-none focus:border-indigo-500"
                    />
                    <textarea
                      placeholder="Descripción detallada para la IA..."
                      value={newStyleDesc}
                      onChange={(e) => setNewStyleDesc(e.target.value)}
                      className="w-full p-2 rounded-lg border border-black/5 text-sm outline-none focus:border-indigo-500 h-20 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addCustomStyle}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700"
                      >
                        Guardar Estilo
                      </button>
                      <button
                        onClick={() => setIsAddingStyle(false)}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-black/40 hover:bg-black/5"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4">
                {customStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden
                      ${selectedStyleId === style.id
                        ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                        : 'border-black/5 hover:border-black/10 bg-white'}`}
                  >
                    {selectedStyleId === style.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      </div>
                    )}
                    <p className="font-bold text-sm mb-1">{style.name}</p>
                    <p className="text-xs text-black/50 leading-relaxed truncate">{style.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Model Selection */}
            <section className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">6. Motor de Generación (IA)</label>
              <div className="grid grid-cols-1 gap-3">
                {GENERATION_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 relative
                      ${selectedModel === model.id
                        ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                        : 'border-black/5 hover:border-black/10 bg-white'}`}
                  >
                    {selectedModel === model.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm">{model.name}</p>
                      {model.id === 'gemini-3.1-flash-image-preview' && (
                        <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Pro</span>
                      )}
                    </div>
                    <p className="text-xs text-black/50 leading-relaxed">{model.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Action Button */}
            <button
              onClick={handleGenerateAll}
              disabled={sourceImages.length === 0 || isGenerating}
              className={`w-full py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                ${sourceImages.length === 0 || isGenerating
                  ? 'bg-black/5 text-black/20 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20'}`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Generando {isLandingKitMode ? 'Estructuras' : 'Formatos'}...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  {isLandingKitMode ? 'Generar Kit de Landing Page' : 'Generar Campaña Completa'}
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-32">
            <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-black/5 border border-black/5 relative min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-xl">Vista Previa de Campaña</h3>
                  <p className="text-sm text-black/40">Producto {activeImageIndex + 1} de {sourceImages.length || 0}</p>
                </div>
                {generatedImages[activeImageIndex]?.[`${isLandingKitMode ? activeTemplate : selectedTemplate}_${activeFormat}`] && (
                  <button
                    onClick={() => downloadImage(activeImageIndex, isLandingKitMode ? activeTemplate : selectedTemplate, activeFormat)}
                    className="p-3 bg-black text-white rounded-full hover:bg-black/80 transition-all active:scale-90"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Image Selector for Preview */}
              {sourceImages.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {sourceImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shrink-0
                        ${activeImageIndex === idx ? 'bg-indigo-600 text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                    >
                      Producto {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Mode Specific Tabs */}
              {isLandingKitMode ? (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {MARKETING_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTemplate(t.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0
                        ${activeTemplate === t.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-black/5 text-black/40 hover:text-black/60'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 mb-6 p-1 bg-black/5 rounded-2xl">
                  {AD_FORMATS.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setActiveFormat(format.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all
                        ${activeFormat === format.id
                          ? 'bg-white shadow-sm text-black'
                          : 'text-black/40 hover:text-black/60'}`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              )}

              <div className={`flex-1 relative rounded-3xl overflow-hidden bg-black/5 flex items-center justify-center border border-black/5 transition-all duration-500
                ${activeFormat === '9:16' ? 'aspect-[9/16] max-h-[500px] mx-auto' : activeFormat === '16:9' ? 'aspect-[16/9]' : 'aspect-square'}`}>
                <AnimatePresence mode="wait">
                  {generatedImages[activeImageIndex]?.[`${isLandingKitMode ? activeTemplate : selectedTemplate}_${activeFormat}`] ? (
                    <motion.img
                      key={`gen-${activeImageIndex}-${isLandingKitMode ? activeTemplate : selectedTemplate}-${activeFormat}`}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      src={generatedImages[activeImageIndex][`${isLandingKitMode ? activeTemplate : selectedTemplate}_${activeFormat}`]}
                      alt="Generated"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : isGenerating && !generatedImages[activeImageIndex]?.[`${isLandingKitMode ? activeTemplate : selectedTemplate}_${activeFormat}`] ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 text-black/20"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600/40">Creando {activeFormat}...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center p-8"
                    >
                      <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="text-black/20 w-8 h-8" />
                      </div>
                      <p className="text-black/40 text-sm font-medium">
                        Genera para ver la vista previa de {activeFormat}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ad Copy Mockup */}
              <div className="mt-8 space-y-3">
                <div className="h-4 bg-black/5 rounded-full w-3/4" />
                <div className="h-4 bg-black/5 rounded-full w-1/2" />
                <div className="pt-4 flex items-center justify-between border-t border-black/5">
                  <span className="text-xs font-bold uppercase tracking-widest text-black/30">Formato de Anuncio</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/10" />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl">
                <p className="text-indigo-600 font-bold text-2xl mb-1">4.8x</p>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600/60">Aumento de CTR</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl">
                <p className="text-blue-600 font-bold text-2xl mb-1">IA</p>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600/60">Optimización Inteligente</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-40 grayscale">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">AdGen AI</span>
          </div>
          <p className="text-sm text-black/40">© 2024 AdGen AI. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm font-medium text-black/40">
            <a href="#" className="hover:text-black transition-colors">Privacidad</a>
            <a href="#" className="hover:text-black transition-colors">Términos</a>
            <a href="#" className="hover:text-black transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
