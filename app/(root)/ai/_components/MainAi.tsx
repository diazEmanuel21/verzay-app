"use client";

import { ChangeEvent, useCallback, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessPromptBuilder, FqaBuilder, PromptPreview, TrainingBuilder } from "./";
import { buildPrompt } from "./helpers";
import { BusinessValues, initialValues, MainAiInterface } from "@/types/agentAi";
import { ProductBuilder } from './ProductBuilder';

export const MainAi = ({
    flows,
    user,
}: MainAiInterface) => {
    const [values, setValues] = useState<BusinessValues>(initialValues);

    const handleChange = useCallback(
        (key: keyof BusinessValues) =>
            (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setValues(v => ({ ...v, [key]: e.target.value }));
            },
        []
    );

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
            {/* grid: 1 columna en móvil, 2 en desktop */}
            <div className="grid gap-4 lg:grid-cols-[1fr,420px]">
                {/* Columna izquierda: constructor con tabs */}
                <div className="space-y-4">
                    <Tabs defaultValue="business" className="w-full">
                        {/* Sticky + overflow-x */}
                        <div className="sticky top-0 z-20 -mx-4 lg:mx-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <div className="overflow-x-auto no-scrollbar">
                                <TabsList className="flex min-w-full w-max gap-2 px-4 py-2">
                                    <TabsTrigger className="shrink-0" value="business">Negocio</TabsTrigger>
                                    <TabsTrigger className="shrink-0" value="training">Entrenamiento</TabsTrigger>
                                    <TabsTrigger className="shrink-0" value="faq">Preguntas</TabsTrigger>
                                    <TabsTrigger className="shrink-0" value="products">Productos</TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        <TabsContent value="business" className="mt-4">
                            <BusinessPromptBuilder values={values} handleChange={handleChange} />
                        </TabsContent>

                        <TabsContent value="training" className="mt-4">
                            <TrainingBuilder
                                flows={flows}
                                values={{ training: values.training ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                            />
                        </TabsContent>

                        <TabsContent value="faq" className="mt-4">
                            <FqaBuilder values={{ faq: values.faq ?? "" }} handleChange={handleChange} />
                        </TabsContent>

                        <TabsContent value="products" className="mt-4">
                            <ProductBuilder values={{ products: values.products ?? "" }} handleChange={handleChange} />
                        </TabsContent>
                    </Tabs>

                </div>

                {/* Columna derecha: preview (sticky en desktop) */}
                <aside className="lg:sticky h-fit">
                    <PromptPreview prompt={prompt} />
                </aside>
            </div>
        </div>
    );
}