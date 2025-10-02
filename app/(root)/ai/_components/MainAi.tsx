"use client";

import { useCallback, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessPromptBuilder, PromptPreview, TrainingBuilder } from "./";
import { buildPrompt } from "./helpers";
import { BusinessValues, initialValues } from "@/types/agentAi";

export const MainAi = () => {
    const [values, setValues] = useState<BusinessValues>(initialValues);

    const handleChange = useCallback(
        (key: keyof BusinessValues) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">MainAi</h1>
            <Tabs defaultValue="business" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="business">Negocio</TabsTrigger>
                    <TabsTrigger value="training">Entrenamiento</TabsTrigger>
                    <TabsTrigger value="extras">Extras</TabsTrigger>
                </TabsList>

                <TabsContent value="business" className="mt-4">
                    <BusinessPromptBuilder values={values} handleChange={handleChange} />
                </TabsContent>

                <TabsContent value="training" className="mt-4">
                    <TrainingBuilder values={{ training: values.training ?? '' }} handleChange={handleChange} />
                </TabsContent>

                <TabsContent value="extras" className="mt-4">
                    <Card className="border-muted/60">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Extras (próximamente)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Espacio para funciones futuras (tono, reglas, herramientas, etc.).</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <PromptPreview prompt={prompt} />
        </div>
    );
}