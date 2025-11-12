"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow } from "@prisma/client";
import { useManagementAutosave } from "./hooks/useManagementAutosave";
import ElementRenderer from "./action-steeps/ElementRenderer";
import { FunctionSelector } from "./FunctionSelector";
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
    return el.kind === "function";
}

/* === NUEVO: inferir label legible del elemento seleccionado para titular el bloque === */
function getElementLabel(el?: ElementItem): string {
    if (!el) return "";
    const anyEl = el as any;
    return (
        anyEl.label ||
        anyEl.name ||
        anyEl.flowName ||
        anyEl.fn ||
        (el.kind === "text" ? "Texto" : "Acción")
    );
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

    // === NUEVO: proxy para setSteps que completa título automáticamente tras elegir acción ===
    const setStepsAuto: React.Dispatch<React.SetStateAction<ManagementItem[]>> = (updater) => {
        setSteps((prev) => {
            const next = typeof updater === "function" ? (updater as (p: ManagementItem[]) => ManagementItem[])(prev) : updater;

            let changed = false;
            const patched = next.map((s) => {
                // Si no hay título y ya tiene al menos un elemento, usamos el label del primero.
                if (!s.title?.trim() && (s.elements?.length ?? 0) > 0) {
                    const label = getElementLabel(s.elements[0]);
                    if (label) {
                        changed = true;
                        return { ...s, title: String(label), openPicker: false };
                    }
                }
                // Al seleccionar algo desde el picker, cerramos el picker si estaba abierto
                if (s.openPicker && (s.elements?.length ?? 0) > 0) {
                    changed = true;
                    return { ...s, openPicker: false };
                }
                return s;
            });

            return changed ? patched : next;
        });
    };

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

    // PREVIEW markdown
    const managementPreview = useMemo(() => {
        return buildSectionedPrompt(steps as any, {
            emptyMessage: "Aún no has agregado bloques de gestión. Usa “Agregar acción” para comenzar.",
            sectionLabel: (n, step) => `Bloque ${n} — ${step.title || "Sin título"}`,
            // elementsLabel: (n) => `Elementos del bloque: ${n}`,
            elementsLabel: (n) => ``,
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

    const openActionPickerFor = (stepId: string) => {
        setSteps((prev) =>
            prev.map((s) => ({ ...s, openPicker: s.id === stepId })) // abre ese y cierra los demás
        );
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
                        <Button
                            size="sm"
                            onClick={() =>
                                steps.length
                                    ? openActionPickerFor(steps[steps.length - 1].id)
                                    : addEmptyStep() // ya crea con openPicker: true
                            }
                            className="gap-2"
                        >
                            + Agregar acción
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {steps.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No has agregado bloques de gestión. Usa “Agregar acción” para comenzar.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {steps.map((step, idx) => (
                            <Card key={step.id} className="border-none">
                                <div>
                                    {/* Header elementos */}
                                    <div className="flex items-center flex-row gap-2 justify-end">
                                            <FunctionSelector
                                                step={step as any}
                                                setSteps={setStepsAuto as any}
                                                notificationNumber={notificationNumber ?? ""}
                                                isManagement={true}
                                            />
                                    </div>

                                    {/* Lista de elementos */}
                                    <div>
                                        {!step.elements || step.elements.length === 0 ? (
                                            <div className="text-center text-sm text-muted-foreground">
                                                No hay elementos. Click en crear gestión para comenzar.
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
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>

            {steps.length > 0 && (
                <CardFooter className="pb-2 flex items-center gap-2 flex-row justify-end">
                    {/* <CardTitle className="text-base">Gestión</CardTitle> */}
                    <Button
                        size="sm"
                        onClick={() =>
                            steps.length
                                ? openActionPickerFor(steps[steps.length - 1].id)
                                : addEmptyStep() // ya crea con openPicker: true
                        }
                        className="gap-2"
                    >
                        Crear gestión
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
