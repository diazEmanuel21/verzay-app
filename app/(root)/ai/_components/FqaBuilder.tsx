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

/* ---------- Modelo interno ---------- */
type QaItem = {
    id: string;
    q: string; // pregunta
    a: string; // respuesta
};

/* ---------- Plantillas predefinidas ---------- */
const PRESETS: Array<{ title: string; answer: string }> = [
    { title: "Promociones, descuentos y ofertas", answer: "Inserta aquí la respuesta oficial sobre promociones disponibles" },
    { title: "Cliente pide descuento", answer: "Inserta aquí la respuesta para solicitudes de rebaja o promociones individuales" },
    { title: "Me interesa", answer: "Inserta aquí la respuesta para leads interesados que desean avanzar" },
    { title: "¿Cómo se hace la compra?", answer: "Explica brevemente el proceso de compra paso a paso" },
    { title: "Garantía de compra", answer: "Indica condiciones de garantía, cobertura y duración" },
    { title: "Medios de pago", answer: "Describe los métodos de pago aceptados: transferencias, contra entrega, etc." },
    { title: "Tiempo de entrega", answer: "Indica tiempos de envío o entrega por zona o producto" },
    { title: "Dirección, ubicación o tienda", answer: "Indica ubicación física o si es 100% online" },
    { title: "Crédito y/o contra entrega", answer: "Informa si está disponible y bajo qué condiciones" },
    { title: "Requisitos (para crédito o contra entrega)", answer: "Enumera los requisitos mínimos que debe cumplir el cliente para aplicar" },
];

export interface FaqSimpleProps {
    values: { faq: string };
    handleChange: (
        key: "faq"
    ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function FqaBuilder({ values, handleChange }: FaqSimpleProps) {
    const [openPicker, setOpenPicker] = useState(false);
    const [items, setItems] = useState<QaItem[]>([]);

    // 1) Cargar por defecto todas las plantillas
    useEffect(() => {
        if (items.length === 0) {
            const initial = PRESETS.map((p) => ({
                id: nanoid(),
                q: p.title,
                a: p.answer,
            }));
            setItems(initial);
        }
        // solo en el primer render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Markdown con el formato exacto
    const prompt = useMemo(() => {
        const blocks = items
            .filter((i) => i.q.trim() || i.a.trim())
            .map((i) =>
                [`## ${i.q.trim() || "Pregunta"}`, `*Respuesta:*`, i.a.trim() || "(sin respuesta)"].join("\n")
            );
        return blocks.join("\n\n---\n\n");
    }, [items]);

    // Sincroniza con el padre (sin bucles)
    useEffect(() => {
        if (values.faq !== prompt) {
            const setFaq = handleChange("faq");
            setFaq({ target: { value: prompt } } as ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, values.faq]);

    // Deshabilitar plantillas ya añadidas
    const addedQuestions = useMemo(
        () => new Set(items.map((i) => i.q.trim().toLowerCase())),
        [items]
    );
    const isAdded = (title: string) => addedQuestions.has(title.trim().toLowerCase());

    const updateQ = (id: string, v: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, q: v } : it)));

    const updateA = (id: string, v: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, a: v } : it)));

    const addFaq = () =>
        setItems((prev) => [...prev, { id: nanoid(), q: "", a: "" }]);

    const addFromPreset = (title: string) => {
        if (isAdded(title)) return;
        const preset = PRESETS.find((p) => p.title === title);
        if (!preset) return;
        setItems((prev) => [
            ...prev,
            { id: nanoid(), q: preset.title, a: preset.answer },
        ]);
        setOpenPicker(false);
    };

    // 2) Eliminar FAQ
    const removeItem = (id: string) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Preguntas Frecuentes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {items.map((it) => (
                    <div key={it.id} className="rounded-md border p-3 border-muted/60 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Pregunta:</div>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} aria-label="Eliminar FAQ">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <Textarea
                            placeholder="¿Cuáles son los horarios de atención?"
                            value={it.q}
                            onChange={(e) => updateQ(it.id, e.target.value)}
                            className="min-h-[56px]"
                        />

                        <div className="text-sm font-medium mt-2">Respuesta:</div>
                        <Textarea
                            placeholder="Atendemos de lunes a domingo de 8:00 AM a 10:00 PM"
                            value={it.a}
                            onChange={(e) => updateA(it.id, e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>
                ))}

                <div className="flex flex-row w-full gap-2">
                    {/* Azul: Agregar desde Plantillas */}
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
                                        {PRESETS.map((p) => {
                                            const disabled = isAdded(p.title);
                                            return (
                                                <CommandItem
                                                    key={p.title}
                                                    onSelect={() => !disabled && addFromPreset(p.title)}
                                                    className={disabled ? "opacity-50 pointer-events-none" : ""}
                                                    aria-disabled={disabled}
                                                >
                                                    {p.title}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Gris: Agregar FAQ vacío */}
                    <Button variant="secondary" onClick={addFaq} className="gap-2">
                        + Agregar FAQ
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}