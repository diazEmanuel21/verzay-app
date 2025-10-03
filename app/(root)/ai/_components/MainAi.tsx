"use client";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BusinessPromptBuilder, FqaBuilder, PromptPreview, TrainingBuilder } from "./";
import { buildPrompt } from "./helpers";
import { BusinessValues, initialValues, MainAiInterface } from "@/types/agentAi";
import { ProductBuilder } from "./ProductBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const TYPE_AI_LABELS = {
    business: "Negocio",
    training: "Entrenamiento",
    faq: "Preguntas",
    products: "Productos",
} as const;

type TabKey = keyof typeof TYPE_AI_LABELS;

export const MainAi = ({ flows, user }: MainAiInterface) => {
    const [values, setValues] = useState<BusinessValues>(initialValues);
    const [activeTab, setActiveTab] = useState<TabKey>("business");
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleChange = useCallback(
        (key: keyof BusinessValues) =>
            (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setValues((v) => ({ ...v, [key]: e.target.value }));
            },
        []
    );

    const handleTabClick = (key: TabKey) => setActiveTab(key);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 150;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const reset = () =>
        setValues({
            nombre: "",
            sector: "",
            ubicacion: "",
            horarios: "",
            maps: "",
            telefono: "",
            email: "",
            sitio: "",
            facebook: "",
            instagram: "",
            tiktok: "",
            youtube: "",
            notas: "",
            training: "",
        });

    const prompt = useMemo(() => buildPrompt(values), [values]);

    return (
        <div className="mx-auto max-w-7xl">
            {/* Tabs CONTROLADAS por activeTab; sin TabsList/Trigger */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
                {/* Sticky + overflow-x + controles */}
                <div className="sticky top-0 z-20 -mx-4 lg:mx-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                        {/* Flechas solo móviles */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => scroll("left")}
                            className="sm:hidden"
                            aria-label="Desplazar pestañas a la izquierda"
                        >
                            <ArrowLeft />
                        </Button>

                        {/* Carrusel de botones de pestañas */}
                        <div
                            ref={scrollRef}
                            className={cn(
                                "flex overflow-x-auto gap-2 pb-1 scrollbar-none",
                                "sm:overflow-visible sm:justify-start sm:flex-wrap"
                            )}
                        >
                            {(Object.keys(TYPE_AI_LABELS) as TabKey[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleTabClick(key)}
                                    className={cn(
                                        "px-4 py-2 rounded-t-md font-medium text-sm border-b-2 transition-colors duration-150 whitespace-nowrap",
                                        activeTab === key
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                    aria-pressed={activeTab === key}
                                    aria-label={`Cambiar a ${TYPE_AI_LABELS[key]}`}
                                >
                                    {TYPE_AI_LABELS[key]}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => scroll("right")}
                            className="sm:hidden"
                            aria-label="Desplazar pestañas a la derecha"
                        >
                            <ArrowRight />
                        </Button>
                    </div>
                </div>

                {/* Layout principal: contenido + preview */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 mt-4">
                    {/* Columna izquierda: contenido de cada Tab */}
                    <div className="flex-1 w-full">
                        <TabsContent value="business" className="m-0">
                            <BusinessPromptBuilder values={values} handleChange={handleChange} />
                        </TabsContent>

                        <TabsContent value="training" className="m-0">
                            <TrainingBuilder
                                flows={flows}
                                values={{ training: values.training ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                            />
                        </TabsContent>

                        <TabsContent value="faq" className="m-0">
                            <FqaBuilder values={{ faq: values.faq ?? "" }} handleChange={handleChange} />
                        </TabsContent>

                        <TabsContent value="products" className="m-0">
                            <ProductBuilder values={{ products: values.products ?? "" }} handleChange={handleChange} />
                        </TabsContent>
                    </div>

                    {/* Columna derecha: preview (sticky en desktop) */}
                    <aside className="w-full lg:w-[420px] lg:sticky lg:top-16">
                        <PromptPreview prompt={prompt} />
                    </aside>
                </div>
            </Tabs>
        </div>
    );
};