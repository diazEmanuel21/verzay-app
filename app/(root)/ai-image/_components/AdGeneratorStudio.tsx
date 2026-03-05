'use client';

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { generateAiImageAction } from "@/actions/ai-image-actions";

type CustomStyle = {
  id: string;
  name: string;
  description: string;
};

type AdFormat = "1:1" | "9:16" | "16:9";

const DEFAULT_STYLES: CustomStyle[] = [
  { id: "minimalist", name: "Minimalista", description: "Fondos limpios y enfoque total en el producto." },
  { id: "premium", name: "Premium", description: "Iluminacion de lujo y texturas de alta gama." },
  { id: "lifestyle", name: "Estilo de Vida", description: "Entornos naturales y realistas." },
  { id: "creative", name: "Creativo", description: "Composiciones artisticas llamativas." },
];

const AD_FORMATS = [
  { id: "1:1" as const, name: "Post Instagram", sub: "1080 x 1080" },
  { id: "9:16" as const, name: "Story / WhatsApp", sub: "1080 x 1920" },
  { id: "16:9" as const, name: "Post Facebook", sub: "1200 x 675" },
];

const MARKETING_TEMPLATES = [
  { id: "hero", name: "1. Hero Section" },
  { id: "pain", name: "2. Identificacion Dolor" },
  { id: "solution", name: "3. Presentacion Solucion" },
  { id: "benefits", name: "4. Beneficios Profundos" },
  { id: "social", name: "5. Prueba Social" },
  { id: "demo", name: "6. Demostracion" },
  { id: "objections", name: "7. Manejo Objeciones" },
  { id: "offer", name: "8. Oferta Irresistible" },
  { id: "cta", name: "9. Llamado a la Accion" },
  { id: "trust", name: "10. Seccion Confianza" },
];

export function AdGeneratorStudio() {
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<number, Record<string, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLandingKitMode, setIsLandingKitMode] = useState(false);
  const [includeText, setIncludeText] = useState(false);
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>(DEFAULT_STYLES);
  const [selectedStyleId, setSelectedStyleId] = useState(DEFAULT_STYLES[0].id);
  const [selectedTemplate, setSelectedTemplate] = useState(MARKETING_TEMPLATES[0].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [visualDNA, setVisualDNA] = useState("");
  const [activeFormat, setActiveFormat] = useState<AdFormat>("1:1");
  const [activeTemplate, setActiveTemplate] = useState<string>(MARKETING_TEMPLATES[0].id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleDesc, setNewStyleDesc] = useState("");
  const [, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewKey = `${isLandingKitMode ? activeTemplate : selectedTemplate}_${activeFormat}`;
  const previewImage = generatedImages[activeImageIndex]?.[previewKey];
  const selectedStyle = useMemo(
    () => customStyles.find((item) => item.id === selectedStyleId)?.description || "",
    [customStyles, selectedStyleId]
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeImage = (index: number) => {
    setSourceImages((prev) => prev.filter((_, i) => i !== index));
    setGeneratedImages((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    if (activeImageIndex >= sourceImages.length - 1 && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };

  const addCustomStyle = () => {
    if (!newStyleName || !newStyleDesc) return;
    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name: newStyleName,
      description: newStyleDesc,
    };
    setCustomStyles((prev) => [...prev, newStyle]);
    setSelectedStyleId(newStyle.id);
    setNewStyleName("");
    setNewStyleDesc("");
    setIsAddingStyle(false);
  };

  const handleGenerateAll = async () => {
    if (sourceImages.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const newGenerated = { ...generatedImages };
      const templatesToGen = isLandingKitMode ? MARKETING_TEMPLATES.map((t) => t.id) : [selectedTemplate];
      const formatsToGen = isLandingKitMode ? (["1:1"] as AdFormat[]) : AD_FORMATS.map((f) => f.id);

      for (let i = 0; i < sourceImages.length; i++) {
        if (!newGenerated[i]) newGenerated[i] = {};

        for (const templateId of templatesToGen) {
          for (const formatId of formatsToGen) {
            const key = `${templateId}_${formatId}`;
            const result = await generateAiImageAction({
              sourceImage: sourceImages[i],
              style: selectedStyle,
              customPrompt,
              template: templateId,
              aspectRatio: formatId,
              visualDNA,
              includeText,
            });

            if (!result.success || !result.image) {
              throw new Error(result.message || "No se pudo generar la imagen.");
            }

            newGenerated[i][key] = result.image;
            startTransition(() => {
              setGeneratedImages({ ...newGenerated });
            });
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Error al generar imagenes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageIndex: number, templateId: string, formatId: AdFormat) => {
    const key = `${templateId}_${formatId}`;
    const imageSrc = generatedImages[imageIndex]?.[key];
    if (!imageSrc) return;

    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `ad-${imageIndex + 1}-${templateId}-${formatId.replace(":", "x")}.png`;
    link.click();
  };

  return (
    <div className="min-h-full bg-[#FDFCFB] text-[#1A1A1A]">
      <div className="grid lg:grid-cols-2 gap-10 items-start p-4 md:p-6">
        <div className="space-y-8">
          <section>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Generador de <span className="text-indigo-600">Anuncios de Producto</span>
            </h1>
            <p className="text-black/60 mt-2">
              Crea piezas publicitarias por formato o genera un kit completo de landing.
            </p>
          </section>

          <section className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">1. Sube fotos del producto</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center border-black/10 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mb-2">
                <Upload className="text-black/40 w-6 h-6" />
              </div>
              <p className="font-medium text-sm">Haz clic para subir imagenes</p>
              <p className="text-xs text-black/40">Puedes seleccionar varios archivos</p>
            </div>

            {sourceImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {sourceImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                      activeImageIndex === idx ? "border-indigo-500" : "border-transparent hover:border-black/10"
                    }`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <Image
                      src={img}
                      alt={`Producto ${idx + 1}`}
                      fill
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                    >
                      <RefreshCw className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">2. Estructura marketing</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIncludeText((prev) => !prev)}
                  className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                    includeText ? "bg-indigo-600 text-white" : "bg-black/10 text-black/60"
                  }`}
                >
                  Incluir texto
                </button>
                <button
                  onClick={() => setIsLandingKitMode((prev) => !prev)}
                  className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                    isLandingKitMode ? "bg-indigo-600 text-white" : "bg-black/10 text-black/60"
                  }`}
                >
                  Kit landing
                </button>
              </div>
            </div>

            {!isLandingKitMode ? (
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-3 rounded-2xl border-2 border-black/5 focus:border-indigo-500 outline-none bg-white text-sm font-medium"
              >
                {MARKETING_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-indigo-700 font-medium">
                Se generaran las 10 etapas de la landing por cada producto.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">3. ADN visual</label>
            <input
              type="text"
              value={visualDNA}
              onChange={(e) => setVisualDNA(e.target.value)}
              placeholder="Ej: cocina moderna minimalista, tonos arena y madera clara..."
              className="w-full p-3 rounded-2xl border-2 border-black/5 focus:border-indigo-500 outline-none text-sm"
            />
          </section>

          <section className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">4. Detalles especificos</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ej: reloj de lujo sobre marmol negro con iluminacion dramatica..."
              className="w-full p-3 rounded-2xl border-2 border-black/5 focus:border-indigo-500 outline-none min-h-[100px] resize-none text-sm"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">5. Estilo visual</label>
              <button
                onClick={() => setIsAddingStyle(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Crear estilo
              </button>
            </div>

            <AnimatePresence>
              {isAddingStyle && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 space-y-2 overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Nombre del estilo"
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-black/5 text-sm outline-none focus:border-indigo-500"
                  />
                  <textarea
                    placeholder="Descripcion detallada para la IA..."
                    value={newStyleDesc}
                    onChange={(e) => setNewStyleDesc(e.target.value)}
                    className="w-full p-2 rounded-lg border border-black/5 text-sm outline-none focus:border-indigo-500 h-20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={addCustomStyle} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700">
                      Guardar estilo
                    </button>
                    <button onClick={() => setIsAddingStyle(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-black/40 hover:bg-black/5">
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              {customStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`text-left p-3 rounded-2xl border-2 relative ${
                    selectedStyleId === style.id ? "border-indigo-500 bg-indigo-50/50" : "border-black/5 hover:border-black/10 bg-white"
                  }`}
                >
                  {selectedStyleId === style.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    </div>
                  )}
                  <p className="font-bold text-sm">{style.name}</p>
                  <p className="text-xs text-black/50 truncate">{style.description}</p>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleGenerateAll}
            disabled={sourceImages.length === 0 || isGenerating}
            className={`w-full py-4 rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all ${
              sourceImages.length === 0 || isGenerating
                ? "bg-black/5 text-black/30 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {isLandingKitMode ? "Generar kit de landing" : "Generar campana"}
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-[32px] p-6 shadow-2xl shadow-black/5 border border-black/5 min-h-[560px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl">Vista previa</h3>
                <p className="text-sm text-black/40">
                  Producto {sourceImages.length > 0 ? activeImageIndex + 1 : 0} de {sourceImages.length}
                </p>
              </div>
              {previewImage && (
                <button
                  onClick={() =>
                    downloadImage(activeImageIndex, isLandingKitMode ? activeTemplate : selectedTemplate, activeFormat)
                  }
                  className="p-3 bg-black text-white rounded-full hover:bg-black/80"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>

            {sourceImages.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {sourceImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${
                      activeImageIndex === idx ? "bg-indigo-600 text-white" : "bg-black/5 text-black/40"
                    }`}
                  >
                    Producto {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {isLandingKitMode ? (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {MARKETING_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTemplate(t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 ${
                      activeTemplate === t.id ? "bg-indigo-600 text-white" : "bg-black/5 text-black/40"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 mb-4 p-1 bg-black/5 rounded-2xl">
                {AD_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setActiveFormat(format.id)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold ${
                      activeFormat === format.id ? "bg-white shadow-sm text-black" : "text-black/40"
                    }`}
                    title={format.sub}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
            )}

            <div
              className={`flex-1 rounded-3xl overflow-hidden bg-black/5 flex items-center justify-center border border-black/5 ${
                activeFormat === "9:16"
                  ? "aspect-[9/16] max-h-[500px] mx-auto"
                  : activeFormat === "16:9"
                    ? "aspect-[16/9]"
                    : "aspect-square"
              }`}
            >
              <AnimatePresence mode="wait">
                {previewImage ? (
                  <motion.div
                    key={`preview-${activeImageIndex}-${previewKey}`}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="relative w-full h-full"
                  >
                    <Image src={previewImage} alt="Generated" fill unoptimized className="w-full h-full object-cover" />
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-indigo-600/70">
                    <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Creando pieza...</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="text-black/20 w-8 h-8" />
                    </div>
                    <p className="text-black/40 text-sm">Genera para ver la vista previa.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

