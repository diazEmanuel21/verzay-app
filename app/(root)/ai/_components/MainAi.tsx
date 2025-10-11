"use client";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BusinessPromptBuilder, ExtraInfoBuilder, FqaBuilder, PromptPreview, TrainingBuilder } from "./";
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
    more: "Extras",
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
            more: "",
        });

    const prompt = useMemo(() => buildPrompt(values), [values]);

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
            {/* Header tabs (no-scroll propio, solo botones horizontales) */}
            <div className="sticky w-full top-0 z-10 -mx-4 lg:mx-0 bg-slate-100 dark:bg-black">
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("left")}
                        className="sm:hidden"
                        aria-label="Desplazar pestañas a la izquierda"
                    >
                        <ArrowLeft />
                    </Button>

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

            {/* Contenedor de layout con altura fija y sin scroll global */}
            <div
                className={cn(
                    // Altura de la zona de content. AJUSTA el 132px según tu navbar/sticky header real.
                    "mt-0 lg:mt-2 h-[calc(100vh-132px)]",
                    // Grid en desktop, stack en mobile
                    "grid lg:grid-cols-[1fr,420px] gap-4",
                    // Bloquear scroll fuera de la columna izquierda
                    "overflow-hidden"
                )}
            >
                {/* Columna izquierda: ÚNICA con scroll vertical */}
                <div className="min-h-0 overflow-y-auto pr-1">
                    <TabsContent value="business" className="m-0">
                        <BusinessPromptBuilder user={user} values={values} handleChange={handleChange} />
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

                    {/* <TabsContent value="more" className="m-0">
                        <ExtraInfoBuilder
                            values={{ more: values.more ?? "" }}
                            handleChange={handleChange}
                        />
                    </TabsContent> */}

                    {/* Padding bottom para no quedar pegado al borde al final del scroll */}
                    <div className="h-6" />
                </div>

                {/* Columna derecha: SIN scroll; sticky en desktop */}
                <aside
                    className="hidden lg:block w-full lg:w-[420px] lg:sticky lg:top-[72px] self-start"
                >
                    <PromptPreview prompt={prompt} />
                </aside>
            </div>
        </Tabs>
    );
};