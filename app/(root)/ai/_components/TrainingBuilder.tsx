"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    CommandSeparator,
} from "@/components/ui/command";
import { X, Plus, FileText, Zap, Trash2 } from "lucide-react";
import { CAPTURE_SNIPPETS, CONSULTA_DATOS_SNIPPET, ElementFunction, ElementItem, ElementText, TrainingBuilderProps } from "@/types/agentAi";
import { Workflow } from "@prisma/client";

export function TrainingBuilder({
    flows = [],
    notificationNumber = null,
    defaultMainMessage = "Saluda al cliente y pregúntale si desea retirar en tienda o envío a domicilio",
    onChange,
    values,
    handleChange,
}: TrainingBuilderProps) {
    const [mainMessage, setMainMessage] = useState(defaultMainMessage);
    const [elements, setElements] = useState<ElementItem[]>([]);
    const [openFnPicker, setOpenFnPicker] = useState(false);

    // ---------- construir el prompt de entrenamiento ----------
    const trainingPrompt = useMemo(() => {
        const lines: string[] = [];

        // encabezado
        if (mainMessage?.trim()) {
            lines.push(`Mensaje principal del paso:\n${mainMessage.trim()}`);
        }

        // elementos
        if (elements.length > 0) {
            lines.push("\nElementos del paso:");
            elements.forEach((el, idx) => {
                const n = idx + 1;
                if (el.kind === "text") {
                    const t = el.text?.trim();
                    if (t) lines.push(`- (${n}) Texto: ${t}`);
                } else if (el.fn === "captura_datos") {
                    lines.push(`- (${n}) Captura de datos — ${el.subtype}: ${el.prompt}`);
                } else if (el.fn === "ejecutar_flujo") {
                    lines.push(`- (${n}) Ejecutar flujo: ${el.flowName ?? "—"}`);
                } else if (el.fn === "notificar_asesor") {
                    lines.push(`- (${n}) Notificar asesor: ${el.notificationNumber ?? "—"}`);
                } else if (el.fn === "consulta_datos") {
                    lines.push(`- (${n}) Consulta de datos:\n${el.prompt}`);
                }
            });
        }

        return lines.join("\n");
    }, [mainMessage, elements]);

    // --- propaga a onChange (interno) y al estado global (training) ---
    useEffect(() => {
        onChange?.({ mainMessage, elements });

        // actualizar values.training usando tu handleChange(key)
        if (values.training !== trainingPrompt) {
            const setTraining = handleChange("training");
            // creamos un "evento" mínimo con target.value; TS está ok con el cast
            setTraining({ target: { value: trainingPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);
        }
    }, [mainMessage, elements, trainingPrompt, onChange, handleChange]);

    const addText = () => {
        setElements((prev) => [
            ...prev,
            { id: nanoid(), kind: "text", text: "" } as ElementText,
        ]);
    };

    const addFunctionCaptura = (
        subtype: "Solicitudes" | "Reclamos" | "Pedidos" | "Reservas"
    ) => {
        setElements((prev) => [
            ...prev,
            {
                id: nanoid(),
                kind: "function",
                fn: "captura_datos",
                subtype,
                prompt: CAPTURE_SNIPPETS[subtype],
            } as ElementFunction,
        ]);
        setOpenFnPicker(false);
    };

    const addFunctionEjecutarFlujo = () => {
        setElements((prev) => [
            ...prev,
            {
                id: nanoid(),
                kind: "function",
                fn: "ejecutar_flujo",
                flowId: null,
                flowName: null,
            } as ElementFunction,
        ]);
        setOpenFnPicker(false);
    };

    const addFunctionNotificar = () => {
        setElements((prev) => [
            ...prev,
            {
                id: nanoid(),
                kind: "function",
                fn: "notificar_asesor",
                notificationNumber: notificationNumber ?? null,
            } as ElementFunction,
        ]);
        setOpenFnPicker(false);
    };

    const addFunctionConsultaDatos = () => {
        setElements((prev) => [
            ...prev,
            {
                id: nanoid(),
                kind: "function",
                fn: "consulta_datos",
                prompt: CONSULTA_DATOS_SNIPPET,
            } as ElementFunction,
        ]);
        setOpenFnPicker(false);
    };

    const removeElement = (id: string) =>
        setElements((prev) => prev.filter((e) => e.id !== id));

    const updateText = (id: string, text: string) =>
        setElements((prev) =>
            prev.map((e) => (e.id === id && e.kind === "text" ? { ...e, text } : e))
        );

    const setFlowOnElement = (id: string, flow: Workflow) =>
        setElements((prev) =>
            prev.map((e) =>
                e.id === id && e.kind === "function" && e.fn === "ejecutar_flujo"
                    ? { ...e, flowId: flow.id, flowName: flow.name }
                    : e
            )
        );

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Entrenamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Mensaje principal */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje principal del paso:</label>
                    <Textarea
                        value={mainMessage}
                        onChange={(e) => setMainMessage(e.target.value)}
                        placeholder="Escribe el mensaje inicial para este paso…"
                        className="min-h-[72px]"
                    />
                </div>

                <Separator className="my-2" />

                {/* Header de elementos */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Elementos del paso</span>
                        <Badge variant="secondary">{elements.length}</Badge>
                    </div>
                    <div className="flex gap-2">
                        <Popover open={openFnPicker} onOpenChange={setOpenFnPicker}>
                            <PopoverTrigger asChild>
                                <Button size="sm" variant="default" className="gap-2">
                                    <Zap className="h-4 w-4" />
                                    Agregar Función
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[320px]" align="end">
                                <Command>
                                    <CommandInput placeholder="Buscar opción…" />
                                    <CommandList>
                                        <CommandEmpty>Sin coincidencias…</CommandEmpty>

                                        <CommandGroup heading="OPCIÓN #1 · Captura de datos">
                                            {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map(
                                                (opt) => (
                                                    <CommandItem
                                                        key={opt}
                                                        onSelect={() => addFunctionCaptura(opt)}
                                                    >
                                                        {opt}
                                                    </CommandItem>
                                                )
                                            )}
                                        </CommandGroup>

                                        <CommandSeparator />

                                        <CommandGroup heading="OPCIÓN #2 · Ejecutar flujo">
                                            <CommandItem onSelect={addFunctionEjecutarFlujo}>
                                                Seleccionar flujo desde BD…
                                            </CommandItem>
                                        </CommandGroup>

                                        <CommandSeparator />

                                        <CommandGroup heading="OPCIÓN #3 · Notificar asesor">
                                            <CommandItem onSelect={addFunctionNotificar}>
                                                Usar número de notificación del perfil
                                            </CommandItem>
                                        </CommandGroup>

                                        <CommandSeparator />

                                        <CommandGroup heading="OPCIÓN #4 · Consulta de datos">
                                            <CommandItem onSelect={addFunctionConsultaDatos}>
                                                Agregar “Consultar Productos”
                                            </CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <Button size="sm" variant="secondary" className="gap-2" onClick={addText}>
                            <FileText className="h-4 w-4" />
                            Agregar Texto
                        </Button>
                    </div>
                </div>

                {/* Lista de elementos */}
                <div className="rounded-lg border border-dashed border-muted/60 p-3">
                    {elements.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            No hay elementos en este paso. Agrega funciones o textos usando los botones de arriba.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {elements.map((el) => {
                                if (el.kind === "text") {
                                    return (
                                        <Card key={el.id} className="bg-muted/30 border-muted/60">
                                            <CardHeader className="py-3 flex-row items-center justify-between">
                                                <CardTitle className="text-sm">Texto adicional</CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeElement(el.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <Textarea
                                                    placeholder="Texto adicional para este paso…"
                                                    value={el.text}
                                                    onChange={(e) => updateText(el.id, e.target.value)}
                                                    className="min-h-[84px]"
                                                />
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                // Funciones
                                if (el.fn === "captura_datos") {
                                    return (
                                        <Card key={el.id} className="bg-muted/20 border-muted/60">
                                            <CardHeader className="py-3 flex-row items-center justify-between">
                                                <CardTitle className="text-sm">
                                                    Formularios · Captura de datos — {el.subtype}
                                                </CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeElement(el.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <label className="text-xs font-medium">Prompt agregado:</label>
                                                <Textarea value={el.prompt} readOnly className="min-h-[80px]" />
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                if (el.fn === "ejecutar_flujo") {
                                    return (
                                        <Card key={el.id} className="bg-muted/20 border-muted/60">
                                            <CardHeader className="py-3 flex-row items-center justify-between">
                                                <CardTitle className="text-sm">Ejecutar flujo</CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeElement(el.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="text-sm text-muted-foreground">
                                                    {flows.length === 0
                                                        ? "No hay flujos cargados desde la BD."
                                                        : "Selecciona un flujo creado en la BD."}
                                                </div>

                                                {flows.length > 0 && (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="w-full justify-between">
                                                                {el.flowName ?? "Elegir flujo…"}
                                                                <Plus className="h-4 w-4 opacity-60" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent align="start" className="p-0 w-[320px]">
                                                            <Command>
                                                                <CommandInput placeholder="Buscar flujo…" />
                                                                <CommandList>
                                                                    <CommandEmpty>Sin resultados…</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {flows.map((f) => (
                                                                            <CommandItem
                                                                                key={f.id}
                                                                                onSelect={() => setFlowOnElement(el.id, f)}
                                                                            >
                                                                                {f.name}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                if (el.fn === "notificar_asesor") {
                                    return (
                                        <Card key={el.id} className="bg-muted/20 border-muted/60">
                                            <CardHeader className="py-3 flex-row items-center justify-between">
                                                <CardTitle className="text-sm">Notificar asesor</CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeElement(el.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <label className="text-xs font-medium">
                                                    Número de notificación (perfil):
                                                </label>
                                                <Input
                                                    value={el.notificationNumber ?? ""}
                                                    readOnly
                                                    placeholder="No disponible"
                                                />
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                // consulta_datos
                                return (
                                    <Card key={el.id} className="bg-muted/20 border-muted/60">
                                        <CardHeader className="py-3 flex-row items-center justify-between">
                                            <CardTitle className="text-sm">Consulta de datos</CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeElement(el.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <label className="text-xs font-medium">Snippet agregado:</label>
                                            <Textarea value={(el as any).prompt} readOnly className="min-h-[96px]" />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}