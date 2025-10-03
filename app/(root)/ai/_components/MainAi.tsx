"use client";

import { ChangeEvent, useCallback, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessPromptBuilder, FqaBuilder, PromptPreview, TrainingBuilder } from "./";
import { buildPrompt } from "./helpers";
import { BusinessValues, initialValues, MainAiInterface } from "@/types/agentAi";

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
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="business">Negocio</TabsTrigger>
                            <TabsTrigger value="training">Entrenamiento</TabsTrigger>
                            <TabsTrigger value="faq">Preguntas</TabsTrigger>
                            {/* <TabsTrigger value="extras">Extras</TabsTrigger> */}
                        </TabsList>

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
                            <FqaBuilder
                                values={{ faq: values.faq ?? "" }}
                                handleChange={handleChange}
                            />
                        </TabsContent>

                        <TabsContent value="extras" className="mt-4">
                            <Card className="border-muted/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Extras (próximamente)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Espacio para funciones futuras (tono, reglas, herramientas, etc.).
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Columna derecha: preview (sticky en desktop) */}
                <aside className="lg:sticky lg:top-6 h-fit">
                    <PromptPreview prompt={prompt} />
                </aside>
            </div>
        </div>
    );
}