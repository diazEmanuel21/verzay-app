"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, PenSquare } from "lucide-react";
import type { ChangeEvent } from "react";

/* ===== Firma por defecto (texto exacto) ===== */
const PROMPT_SIGNATURE_DEFAULT = `# ✍️ FIRMA DEL AGENTE

Debes poner siempre la firma *“🤖 *Asisnte Virtual”* al inicio de cada mensaje o respuesta que le des al usuario, **nunca al final*. Esto permite mantener una identidad clara del agente y una conversación ordenada.

### Ejemplo de uso real:

*Usuario:*  
¿Quien eres?

*Respuesta del agente:*
🤖 Asisnte Virtual
Soy un asistente virtual. ¿En qué puedo ayudarte hoy?`;

type ExtraItem = { id: string; title: string; content: string };

export interface ExtraInfoBuilderProps {
    values: { more: string };
    handleChange: (
        key: "more"
    ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onChange?: (state: {
        items: ExtraItem[];
        firmaEnabled: boolean;
        firmaText: string;
        prompt: string;
    }) => void;
}

export function ExtraInfoBuilder({ values, handleChange, onChange }: ExtraInfoBuilderProps) {
    const [items, setItems] = useState<ExtraItem[]>([{ id: nanoid(), title: "", content: "" }]);
    const [firmaEnabled, setFirmaEnabled] = useState<boolean>(false);
    const [firmaText, setFirmaText] = useState<string>(PROMPT_SIGNATURE_DEFAULT);

    // Construir prompt (Markdown)
    const prompt = useMemo(() => {
        const extraBlocks = items
            .filter((e) => e.title.trim() || e.content.trim())
            .map((e) => [`## Campo: ${e.title.trim() || "(Sin título)"}`, `*Contenido:*`, e.content.trim() || "(Sin contenido)"].join("\n"));

        const parts: string[] = [];
        if (firmaEnabled) parts.push((firmaText || PROMPT_SIGNATURE_DEFAULT).trim());
        if (extraBlocks.length) parts.push(extraBlocks.join("\n\n---\n\n"));
        return parts.join("\n\n---\n\n");
    }, [items, firmaEnabled, firmaText]);

    // Sincroniza con el padre (igual patrón que ProductBuilder)
    useEffect(() => {
        onChange?.({ items, firmaEnabled, firmaText, prompt });
        if (values.more !== prompt) {
            const setMore = handleChange("more");
            setMore({ target: { value: prompt } } as React.ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, items, firmaEnabled, firmaText, values.more]);

    // Handlers
    const addItem = () => setItems((p) => [...p, { id: nanoid(), title: "", content: "" }]);
    const removeItem = (id: string) => setItems((p) => p.filter((x) => x.id !== id));
    const updateTitle = (id: string, v: string) =>
        setItems((p) => p.map((x) => (x.id === id ? { ...x, title: v } : x)));
    const updateContent = (id: string, v: string) =>
        setItems((p) => p.map((x) => (x.id === id ? { ...x, content: v } : x)));

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Campos / Información extra + Firma</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Firma */}
                <div className="rounded-md border p-3 border-muted/60 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Firma del agente (predefinida)</span>
                        {firmaEnabled ? (
                            <Button variant="ghost" onClick={() => setFirmaEnabled(false)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </Button>
                        ) : (
                            <Button variant="secondary" onClick={() => setFirmaEnabled(true)}>
                                <PenSquare className="h-4 w-4 mr-2" />
                                Agregar "firma"
                            </Button>
                        )}
                    </div>

                    {firmaEnabled && (
                        <>
                            <label className="text-sm">Contenido de la firma</label>
                            <Textarea
                                className="min-h-[160px]"
                                placeholder="Texto de firma…"
                                value={firmaText}
                                onChange={(e) => setFirmaText(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Este bloque se insertará al inicio del prompt. Puedes ajustarlo si lo necesitas.
                            </p>
                        </>
                    )}
                </div>

                {/* Items extra */}
                <div className="space-y-3">
                    {items.map((it) => (
                        <div key={it.id} className="rounded-md border p-3 border-muted/60 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Título</label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Eliminar campo"
                                    onClick={() => removeItem(it.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Input placeholder="Ej. Políticas de garantía" value={it.title} onChange={(e) => updateTitle(it.id, e.target.value)} />

                            <label className="text-sm font-medium mt-2">Contenido</label>
                            <Textarea
                                className="min-h-[96px]"
                                placeholder="Texto libre, listas, detalles, condiciones…"
                                value={it.content}
                                onChange={(e) => updateContent(it.id, e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Campos/Información extra</span>
                        <Button type="button" variant="secondary" className="gap-2" onClick={addItem}>
                            <Plus className="h-4 w-4" /> Agregar campo
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}