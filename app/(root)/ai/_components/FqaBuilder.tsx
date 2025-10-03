"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandEmpty,
    CommandInput,
    CommandList,
} from "@/components/ui/command";
import { Plus, Trash2 } from "lucide-react";

/* ---------- Tipos externos (props) ---------- */
export interface QaBuilderExternalProps {
    values: { faq: string };
    handleChange: (
        key: "faq"
    ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onChange?: (state: { items: QaItem[]; prompt: string }) => void;
}

/* ---------- Modelo interno ---------- */
export type QaItem = {
    id: string;
    title: string;
    answer: string;
};

/* ---------- Plantillas predefinidas ---------- */
const PRESETS: Array<{ title: string; answer: string }> = [
    {
        title: "Promociones, descuentos y ofertas",
        answer: "Inserta aquí la respuesta oficial sobre promociones disponibles",
    },
    {
        title: "Cliente pide descuento",
        answer:
            "Inserta aquí la respuesta para solicitudes de rebaja o promociones individuales",
    },
    {
        title: "Me interesa",
        answer:
            "Inserta aquí la respuesta para leads interesados que desean avanzar",
    },
    {
        title: "¿Cómo se hace la compra?",
        answer: "Explica brevemente el proceso de compra paso a paso",
    },
    {
        title: "Garantía de compra",
        answer: "Indica condiciones de garantía, cobertura y duración",
    },
    {
        title: "Medios de pago",
        answer:
            "Describe los métodos de pago aceptados: transferencias, contra entrega, etc.",
    },
    {
        title: "Tiempo de entrega",
        answer: "Indica tiempos de envío o entrega por zona o producto",
    },
    {
        title: "Dirección, ubicación o tienda",
        answer: "Indica ubicación física o si es 100% online",
    },
    {
        title: "Crédito y/o contra entrega",
        answer: "Informa si está disponible y bajo qué condiciones",
    },
    {
        title: "Requisitos (para crédito o contra entrega)",
        answer:
            "Enumera los requisitos mínimos que debe cumplir el cliente para aplicar",
    },
];

/* ---------- Componente ---------- */
export const FqaBuilder = ({ values, handleChange, onChange }: QaBuilderExternalProps) => {
    // Arranca vacío
    const [items, setItems] = useState<QaItem[]>([]);
    const [openPicker, setOpenPicker] = useState(false);

    // Markdown con el formato exacto solicitado
    const prompt = useMemo(() => {
        if (items.length === 0) return "";
        const blocks = items.map((it) => {
            return [
                `## ${it.title}`,
                `*Respuesta:*  `,
                it.answer.trim(),
            ].join("\n");
        });
        return blocks.join("\n\n---\n\n");
    }, [items]);

    // sincroniza con padre (sin bucles)
    useEffect(() => {
        onChange?.({ items, prompt });
        if (values.faq !== prompt) {
            const setFaq = handleChange("faq");
            setFaq({ target: { value: prompt } } as ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, items, values.faq]);

    const addFromPreset = (title: string) => {
        const preset = PRESETS.find((p) => p.title === title);
        if (!preset) return;
        setItems((prev) => [
            ...prev,
            { id: nanoid(), title: preset.title, answer: preset.answer },
        ]);
        setOpenPicker(false);
    };

    const updateAnswer = (id: string, val: string) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, answer: val } : i)));

    const removeItem = (id: string) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle className="text-base">Preguntas & Respuestas</CardTitle>

                <Popover open={openPicker} onOpenChange={setOpenPicker}>
                    <PopoverTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Agregar desde plantillas
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[360px]" align="end">
                        <Command>
                            <CommandInput placeholder="Buscar plantilla..." />
                            <CommandList>
                                <CommandEmpty>Sin resultados…</CommandEmpty>
                                <CommandGroup heading="Plantillas disponibles">
                                    {PRESETS.map((p) => (
                                        <CommandItem key={p.title} onSelect={() => addFromPreset(p.title)}>
                                            {p.title}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Lista actual (editable) */}
                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            No hay preguntas agregadas. Usa <b>Agregar desde plantillas</b>.
                        </div>
                    ) : (
                        items.map((it) => (
                            <div key={it.id} className="rounded-md border p-3 border-muted/60">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">{it.title}</h3>
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-2 text-xs text-muted-foreground font-medium">
                                    *Respuesta:*
                                </div>
                                <Textarea
                                    className="mt-2 min-h-[96px]"
                                    value={it.answer}
                                    onChange={(e) => updateAnswer(it.id, e.target.value)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}