"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ManagementBuilderProps } from "@/types/agentAi";
import { ManagementPromptBuilder } from "./ManagementPromptBuilder";
import { useManagementAutosave } from "./hooks/useManagementAutosave";

export function ManagementBuilder({
    values,
    handleChange,
    promptId,
    version,
    onVersionChange,
    onConflict,
}: ManagementBuilderProps) {
    const [text, setText] = useState<string>(values.management ?? "");

    // Mantén "values.management" sincronizado hacia arriba (como TrainingBuilder hace con values.training)
    useEffect(() => {
        if ((values.management ?? "") !== text) {
            const setManagement = handleChange("management");
            setManagement({ target: { value: text } } as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    // AUTOSAVE — guarda { managementMd: string } en sections.management (libre) o como texto plano
    useManagementAutosave({
        promptId,
        version,
        text,
        onVersionChange,
        onConflict,
    });

    const insertAtCursor = (snippet: string) => {
        setText((prev) => {
            // Inserta con salto si el textarea no está vacío
            return prev?.trim().length ? `${prev}\n\n${snippet}` : snippet;
        });
    };

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2 flex items-center justify-between gap-2 flex-row">
                <CardTitle className="text-base">Gestión</CardTitle>
                <ManagementPromptBuilder onInsert={insertAtCursor} />
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid gap-2">
                    <Label className="text-sm font-medium">Bloque de Gestión (Markdown)</Label>
                    <Textarea
                        className="min-h-[320px]"
                        placeholder="Pega o construye aquí tus reglas y procedimientos de gestión (herramientas, notificaciones, estados, SLA, etc.)…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
            </CardContent>

            <CardFooter className="pb-2 flex items-center justify-end gap-2">
                <ManagementPromptBuilder onInsert={insertAtCursor} buttonText="Insertar fragmento" />
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setText("")}
                >
                    Limpiar
                </Button>
            </CardFooter>
        </Card>
    );
}
