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
import { FunctionSelector } from "./";
import ElementRenderer from "./action-steeps/ElementRenderer";

import type {
    ElementItem,
    PedidoFunctionEl,
    ProductItemType,
    ProductBuilderProps,
    DataSubtype,
} from "@/types/agentAi";
import { buildSectionedPrompt } from "./helpers";

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
    const [items, setItems] = useState<ProductItemType[]>(
        Array.isArray(initialItems) && initialItems.length > 0
            ? (initialItems as ProductItemType[])
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
        return buildSectionedPrompt(items as any, {
            emptyMessage: "Aún no has agregado productos. Usa “Agregar producto” para comenzar.",
            sectionLabel: (n, step) => `Producto ${n} — ${step.title || "Sin título"}`,
            elementsLabel: (n) => `Elementos del producto: ${n}`,
            mainMessageLabel: "Descripción / Objetivo",
            joinSeparator: "\n",
        });
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

    const onSubtypeChange = (stepId: string, elementId: string, subtype: DataSubtype) => {
        setItems((prev) =>
            prev.map((product) => ({
                ...product,
                elements: product.elements.map((el) =>
                    el.id === elementId ? { ...el, subtype } : el // Cambiar el subtipo del elemento
                ),
            }))
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
                                                <span className="text-sm font-medium">Elementos del Producto</span>
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
                                                            onSubtypeChange={onSubtypeChange}
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