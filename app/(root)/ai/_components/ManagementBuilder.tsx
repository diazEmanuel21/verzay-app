"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

import { Workflow } from "@prisma/client";
import { useManagementAutosave } from "./hooks/useManagementAutosave";
import ElementRenderer from "./action-steeps/ElementRenderer";
import { FunctionSelector } from "./FunctionSelector";
import { ManagementPromptBuilder } from "./ManagementPromptBuilder";
import { PromptFragment } from "./helpers/prompt-fragments";
import { buildSectionedPrompt } from "./helpers";

import type {
    ElementItem,
    ManagementBuilderProps,
    ManagementItem,
    PedidoFunctionEl,
    DataSubtype,
} from "@/types/agentAi";

/* type-guard: captura_datos -> Pedidos */
function isPedidoFn(el: ElementItem): el is PedidoFunctionEl {
    return el.kind === "function" && (el as any).fn === "captura_datos" && (el as any).subtype === "Pedidos";
}

export const ManagementBuilder = ({
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
}: ManagementBuilderProps) => {
    // Estado interno: cada card = un "bloque" de gestión
    const [steps, setSteps] = useState<ManagementItem[]>(
        Array.isArray(initialItems) && initialItems.length > 0 ? (initialItems as ManagementItem[]) : []
    );

    // Conflicto: rehidrata desde servidor
    const stableOnConflict = useCallback(
        (serverState: any) => {
            const serverSteps = serverState?.sections?.management?.steps ?? [];
            setSteps(serverSteps);
            onConflict?.(serverState);
        },
        [onConflict]
    );

    // AUTOSAVE
    useManagementAutosave({
        promptId,
        version,
        steps,
        onVersionChange,
        onConflict: stableOnConflict,
    });

    // PREVIEW markdown (mismo patrón que ProductBuilder usando buildSectionedPrompt)
    const managementPreview = useMemo(() => {
        return buildSectionedPrompt(steps as any, {
            emptyMessage: "Aún no has agregado bloques de gestión. Usa “Agregar bloque” para comenzar.",
            sectionLabel: (n, step) => `Bloque ${n} — ${step.title || "Sin título"}`,
            elementsLabel: (n) => `Elementos del bloque: ${n}`,
            mainMessageLabel: "Descripción / Objetivo",
            joinSeparator: "\n",
        });
    }, [steps]);

    // SYNC con parent (como ProductBuilder)
    useEffect(() => {
        const first = steps[0];
        if (first && onChange) {
            onChange({
                mainMessage: first.mainMessage ?? "",
                elements: (first.elements ?? []) as ElementItem[],
            });
        }

        if (values.management !== managementPreview) {
            handleChange("management")({
                target: { value: managementPreview },
            } as ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [managementPreview, steps]);

    /* Mutadores de STEP (bloque) */
    const addEmptyStep = () =>
        setSteps((prev) => [
            ...prev,
            { id: nanoid(), title: "", mainMessage: "", elements: [], openPicker: true },
        ]);

    const addFragment = (snippet: PromptFragment) =>
        setSteps((prev) => [
            ...prev,
            {
                id: nanoid(),
                title: extractTitle(snippet.label),
                mainMessage: snippet.value,
                elements: [{ id: nanoid(), kind: "text", text: snippet.value } as ElementItem],
            },
        ]);

    const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

    const updateTitle = (id: string, v: string) =>
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, title: v } : s)));

    const updateMain = (id: string, v: string) =>
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, mainMessage: v } : s)));

    /* Mutadores de ELEMENTS (por step) */
    const removeElement = (stepId: string, elId: string) => {
        setSteps((prev) =>
            prev.map((s) => (s.id === stepId ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s))
        );
    };

    const updateText = (stepId: string, elId: string, text: string) => {
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
                    ? {
                        ...s,
                        elements: s.elements.map((e) => (e.id === elId && e.kind === "text" ? { ...e, text } : e)),
                    }
                    : s
            )
        );
    };

    const setFlowOnElement = (stepId: string, elId: string, flow: Workflow) => {
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
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

    const addPedidoField = (stepId: string, elId: string, field: string) => {
        const name = field.trim();
        if (!name) return;
        setSteps((prev) =>
            prev.map((s) => {
                if (s.id !== stepId) return s;
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

    const removePedidoField = (stepId: string, elId: string, field: string) => {
        setSteps((prev) =>
            prev.map((s) => {
                if (s.id !== stepId) return s;
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
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
                    ? {
                        ...s,
                        elements: s.elements.map((el) => (el.id === elementId ? { ...el, subtype } : el)),
                    }
                    : s
            )
        );
    };

    const handleInsertFromPicker = ({ id, label, value }: PromptFragment) => {
        addFragment({ id, label, value });
    };

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2 flex items-center justify-between gap-2 flex-row">
                <CardTitle className="text-base">Gestión</CardTitle>
                <div className="flex items-center gap-2">
                    {/* {typeof ManagementPromptBuilder !== "undefined" && (
                        <ManagementPromptBuilder onInsert={handleInsertFromPicker} />
                    )} */}
                    {steps.length < 1 && (
                        <Button size="sm" onClick={addEmptyStep} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Agregar Gestión
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {steps.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No has agregado bloques de gestión. Usa “Agregar bloque” para comenzar.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {steps.map((step, idx) => (
                            <Card key={step.id} className="bg-muted/10 border-muted/60">
                                <CardHeader className="py-3">
                                    <div className="flex items-center gap-2">
                                        {/* <div className="grid w-full max-w-sm items-center gap-3">
                                            <Label htmlFor={step.id}>{`Bloque ${idx + 1}`}</Label>
                                            <Input
                                                id={step.id}
                                                value={step.title ?? ""}
                                                onChange={(e) => updateTitle(step.id, e.target.value)}
                                                className="h-8"
                                                placeholder="Título del bloque"
                                            />
                                        </div> */}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeStep(step.id)}
                                            title="Eliminar bloque"
                                            className="ml-auto"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    {/* Descripción / Mensaje principal */}
                                    {/* <div className="space-y-2">
                                        <label className="text-sm font-medium">{`Descripción ${idx + 1}`}</label>
                                        <Textarea
                                            value={step.mainMessage ?? ""}
                                            onChange={(e) => updateMain(step.id, e.target.value)}
                                            className="min-h-[32px]"
                                        />
                                    </div>

                                    <Separator /> */}

                                    {/* Header elementos */}
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Elementos del bloque</span>
                                            <Badge variant="secondary">{idx + 1}</Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <FunctionSelector
                                                step={step as any}
                                                setSteps={setSteps as any}
                                                notificationNumber={notificationNumber ?? ""}
                                                isManagement={true}
                                            />
                                        </div>
                                    </div>

                                    {/* Lista de elementos */}
                                    <div className="rounded-lg border border-dashed border-muted/60 p-1">
                                        {!step.elements || step.elements.length === 0 ? (
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
                        ))}
                    </div>
                )}
            </CardContent>

            {steps.length > 0 && (
                <CardFooter className="pb-2 flex items-center justify-between gap-2 flex-row">
                    <CardTitle className="text-base">Gestión</CardTitle>
                    <Button size="sm" onClick={addEmptyStep} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar Gestión
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

/* Utils locales */
function extractTitle(txt: string) {
    const firstLine = (txt || "").split(/\r?\n/).find(Boolean) || "";
    const h1 = firstLine.replace(/^#+\s*/, "").trim();
    if (h1) return h1.slice(0, 80);
    const short = txt.replace(/\s+/g, " ").trim().slice(0, 80);
    return short || "Bloque";
}
