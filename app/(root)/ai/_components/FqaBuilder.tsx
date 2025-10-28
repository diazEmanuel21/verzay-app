"use client";

import { ChangeEvent, useEffect, useMemo, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FqaBuilderProps, PRESETS, QaItem } from "@/types/agentAi";
import { useFaqAutosave } from "./hooks/useFaqAutosave";
import { FunctionSelectorInline, previewText } from "./helpers";

export function FqaBuilder({
    values,
    handleChange,
    promptId,
    version,
    onVersionChange,
    onConflict,
    initialItems = [],
    flows = [],
    notificationNumber,
}: FqaBuilderProps) {
    const [openPicker, setOpenPicker] = useState(false);
    const [items, setItems] = useState<QaItem[]>(
        Array.isArray(initialItems) && initialItems.length > 0
            ? initialItems
            : []
    );

    // Autosave estructurado
    const stableOnConflict = useCallback(
        (serverState: any) => {
            const serverItems = serverState?.sections?.faq?.items ?? [];
            setItems(serverItems);
            onConflict?.(serverState);
        },
        [onConflict]
    );

    useFaqAutosave({
        promptId,
        version,
        items,
        onVersionChange,
        onConflict: stableOnConflict,
    });

    // Markdown de preview
    const prompt = useMemo(() => {
        const blocks = items
            .filter((i) => i.q.trim() || i.a.trim())
            .map((i) =>
                [`### ${i.q.trim() || "Pregunta"}`, `* **Respuesta:**`, i.a.trim() || "(sin respuesta)"].join("\n")
            );
        return blocks.join("\n\n---\n\n");
    }, [items]);

    // Sincroniza con el padre
    useEffect(() => {
        if (values.faq !== prompt) {
            handleChange("faq")({
                target: { value: prompt },
            } as ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt]);

    // Helpers
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

    const removeItem = (id: string) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    return (
        <div className="gap-2 flex flex-col">
            <Card className="border-muted/60">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Preguntas Frecuentes</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    {items.map((it) => (
                        <div
                            key={it.id}
                            className="rounded-md border border-muted/60 p-2 space-y-2"
                        >
                            {/* Header compacto */}
                            <div className="flex items-start justify-between gap-2">
                                <pre className="text-[13px] leading-snug whitespace-pre-wrap break-words font-medium text-foreground/90">
                                    {it.q || "Pregunta sin título"}
                                </pre>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(it.id)}
                                    aria-label="Eliminar FAQ"
                                    className="shrink-0 h-7 w-7"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Respuesta compacta */}
                            <pre className="text-xs leading-snug whitespace-pre-wrap break-words text-foreground/80">
                                {previewText(it.a, 80)}
                            </pre>


                        </div>
                    ))}

                    {/* Acciones (compactas) */}
                    <div className="flex w-full flex-row justify-end items-center gap-2">
                            <FunctionSelectorInline<QaItem>
                                mode="faq"
                                items={items}
                                addItem={(newItem) => setItems((prev) => [...prev, newItem])}
                                flows={flows}
                                notificationNumber={notificationNumber}
                            />

                            <Popover open={openPicker} onOpenChange={setOpenPicker}>
                                <PopoverTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Plantillas
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
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}