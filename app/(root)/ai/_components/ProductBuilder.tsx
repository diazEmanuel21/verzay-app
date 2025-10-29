"use client";

import { useCallback, useEffect, useMemo, useState, ChangeEvent } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, PenSquare, X } from "lucide-react";

import { Workflow } from "@prisma/client";
import { useProductsAutosave } from "./hooks/useProductsAutosave";
import { FunctionSelectorInline, previewText } from "./helpers";
import { FunctionSelector } from "./";
import ElementRenderer from "./action-steeps/ElementRenderer";

import type {
    ElementItem,
    PedidoFunctionEl,
    ProductItemDTO,
    ProductBuilderProps,
} from "@/types/agentAi";

/* type-guard: captura_datos -> Pedidos */
function isPedidoFn(el: ElementItem): el is PedidoFunctionEl {
    return el.kind === "function" && (el as any).fn === "captura_datos" && (el as any).subtype === "Pedidos";
}

export const ProductBuilder = ({
    values,
    handleChange,
    onChange,
    promptId,
    version,
    onVersionChange,
    onConflict,
    initialItems = [],
    flows = [],
    notificationNumber,
}: ProductBuilderProps) => {
    const [items, setItems] = useState<ProductItemDTO[]>(
        Array.isArray(initialItems) && initialItems.length > 0
            ? (initialItems as ProductItemDTO[])
            : []
    );

    /* AUTOSAVE: sections.products.items */
    const stableOnConflict = useCallback(
        (serverState: any) => {
            const serverItems = serverState?.sections?.products?.items ?? [];
            setItems(serverItems);
            onConflict?.(serverState);
        },
        [onConflict]
    );

    useProductsAutosave({
        promptId,
        version,
        items,
        onVersionChange,
        onConflict: stableOnConflict,
    });

    /* PREVIEW markdown (consistente con pasos/elementos) */
    const prompt = useMemo(() => {
        if (items.length === 0) return "Aún no has agregado productos. Usa “Agregar producto” para comenzar.";

        const lines: string[] = [];
        items.forEach((step, i) => {
            const n = i + 1;
            lines.push(`\n### Producto ${n} — ${step.title || "Sin título"}`);
            if (step.mainMessage?.trim()) {
                lines.push(`* **Descripción / Objetivo:**\n${step.mainMessage.trim()}`);
            }
            if (Array.isArray(step.elements) && step.elements.length > 0) {
                lines.push(`\n#### Elementos del producto: ${n}`);
                step.elements.forEach((el, idx) => {
                    const k = idx + 1;
                    if (el.kind === "text") {
                        const t = el.text?.trim();
                        if (t) lines.push(`- (${k}) **Regla/parámetro:** ${t}`);
                        return;
                    }
                    if (el.kind === "function") {
                        if (el.fn === "captura_datos") {
                            const base = `- (${k}) Captura de datos — ${el.subtype ?? "—"}: ${el.prompt ?? ""}`;
                            lines.push(base);
                            if ((el as any).subtype === "Pedidos") {
                                const fields = (el as any).fields as string[] | undefined;
                                if (fields?.length) lines.push(`  Campos: ${fields.join(", ")}`);
                            }
                            return;
                        }
                        if (el.fn === "ejecutar_flujo") {
                            lines.push(`> Función: Ejecuta el flujo '${el.flowName || el.flowId || ""}'`);
                            lines.push(`* **Comportamiento:** Después de ejecutar el flujo, tu única respuesta es la indicada en **Regla/parámetro**.`);
                            return;
                        }
                        if (el.fn === "notificar_asesor") {
                            lines.push(`- (${k}) Notificar asesor: ${el.notificationNumber ?? "—"}`);
                            return;
                        }
                        if (el.fn === "consulta_datos") {
                            lines.push(`- (${k}) Consulta de datos:\n${el.prompt ?? ""}`);
                            return;
                        }
                    }
                });
            }
        });
        return lines.join("\n");
    }, [items]);

    /* SYNC con parent */
    useEffect(() => {
        const first = items[0];
        if (first && onChange) {
            onChange({ mainMessage: first.mainMessage ?? "", elements: first.elements ?? [] });
        }
        if (values.products !== prompt) {
            handleChange("products")({
                target: { value: prompt },
            } as ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, items]);

    /* Mutadores de ITEM (producto como “paso”) */
    const addProduct = () =>
        setItems((prev) => [
            ...prev,
            { id: nanoid(), title: "", mainMessage: "", elements: [], openPicker: true },
        ]);

    const removeProduct = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

    const toggleOpen = (id: string, v?: boolean) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, openPicker: v ?? !i.openPicker } : i)));

    const updateTitle = (id: string, v: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, title: v } : it)));

    const updateMain = (id: string, v: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, mainMessage: v } : it)));

    /* Mutadores de ELEMENTS */
    const removeElement = (productId: string, elId: string) => {
        setItems((prev) =>
            prev.map((s) => (s.id === productId ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s))
        );
    };

    const updateText = (productId: string, elId: string, text: string) => {
        setItems((prev) =>
            prev.map((s) =>
                s.id === productId
                    ? {
                        ...s,
                        elements: s.elements.map((e) => (e.id === elId && e.kind === "text" ? { ...e, text } : e)),
                    }
                    : s
            )
        );
    };

    const setFlowOnElement = (productId: string, elId: string, flow: Workflow) => {
        setItems((prev) =>
            prev.map((s) =>
                s.id === productId
                    ? {
                        ...s,
                        elements: s.elements.map((e) =>
                            e.id === elId && e.kind === "function" && (e as any).fn === "ejecutar_flujo"
                                ? { ...(e as any), flowId: flow.id, flowName: flow.name }
                                : e
                        ),
                    }
                    : s
            )
        );
    };

    const addPedidoField = (productId: string, elId: string, field: string) => {
        const name = field.trim();
        if (!name) return;
        setItems((prev) =>
            prev.map((s) => {
                if (s.id !== productId) return s;
                return {
                    ...s,
                    elements: s.elements.map((e) => {
                        if (e.id !== elId || !isPedidoFn(e)) return e;
                        const next = new Set([...(e.fields ?? []), name]);
                        return { ...e, fields: Array.from(next) };
                    }),
                };
            })
        );
    };

    const removePedidoField = (productId: string, elId: string, field: string) => {
        setItems((prev) =>
            prev.map((s) => {
                if (s.id !== productId) return s;
                return {
                    ...s,
                    elements: s.elements.map((e) => {
                        if (e.id !== elId || !isPedidoFn(e)) return e;
                        return { ...e, fields: (e.fields ?? []).filter((f) => f !== field) };
                    }),
                };
            })
        );
    };

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2 flex items-center justify-between gap-2 flex-row">
                <CardTitle className="text-base">Productos</CardTitle>
                {items.length < 1 &&
                    <Button size="sm" onClick={addProduct} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar producto
                    </Button>
                }
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No has creado productos. Crea tu primer producto con “Agregar producto”.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((step, idx) => (
                            <>
                                <Card key={step.id} className="bg-muted/10 border-muted/60">
                                    <CardHeader className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="grid w-full max-w-sm items-center gap-3">
                                                <Label htmlFor={step.id}>{`Producto ${idx + 1}`}</Label>
                                                <Input
                                                    id={step.id}
                                                    value={step.title ?? ""}
                                                    onChange={(e) => updateTitle(step.id, e.target.value)}
                                                    className="h-8"
                                                    placeholder="Título del Producto"
                                                />
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeProduct(step.id)}
                                                title="Eliminar Producto"
                                                className="ml-auto"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        {/* Objetivo / Mensaje principal */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{`Descripción ${idx + 1}`}</label>
                                            <Textarea
                                                value={step.mainMessage ?? ""}
                                                onChange={(e) => updateMain(step.id, e.target.value)}
                                                className="min-h-[32px]"
                                            />
                                        </div>

                                        <Separator />

                                        {/* Header elementos */}
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">Elementos de la Producto</span>
                                                <Badge variant="secondary">{idx + 1}</Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <FunctionSelector
                                                    step={step as any}
                                                    setSteps={setItems as any}
                                                    notificationNumber={notificationNumber ?? ""}
                                                />
                                            </div>
                                        </div>

                                        {/* Lista de elementos */}
                                        <div className="rounded-lg border border-dashed border-muted/60 p-1">
                                            {(!step.elements || step.elements.length === 0) ? (
                                                <div className="text-center text-sm text-muted-foreground">
                                                    No hay elementos. Agrega funciones o textos con los botones de arriba.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {step.elements.map((el) => (
                                                        <ElementRenderer
                                                            key={el.id}
                                                            stepId={step.id}
                                                            el={el as any}
                                                            flows={flows}
                                                            removeElement={removeElement}
                                                            updateText={updateText}
                                                            setFlowOnElement={setFlowOnElement}
                                                            addPedidoField={addPedidoField}
                                                            removePedidoField={removePedidoField}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ))}
                    </div>
                )}
            </CardContent>
            {items.length > 0 && <CardFooter className="pb-2 flex items-center justify-between gap-2 flex-row">
                <CardTitle className="text-base">Productos</CardTitle>

                <Button size="sm" onClick={addProduct} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar producto
                </Button>
            </CardFooter>
            }
        </Card>
    );
}