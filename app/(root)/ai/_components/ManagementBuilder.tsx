"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useManagementAutosave } from "./hooks/useManagementAutosave";
import type { ElementItem, ManagementBuilderProps, ManagementItem } from "@/types/agentAi";
import { ManagementPromptBuilder } from "./ManagementPromptBuilder";

function extractTitle(txt: string) {
    const firstLine = (txt || "").split(/\r?\n/).find(Boolean) || "";
    const h1 = firstLine.replace(/^#+\s*/, "").trim();
    if (h1) return h1.slice(0, 80);
    const short = txt.replace(/\s+/g, " ").trim().slice(0, 80);
    return short || "Fragmento";
}

function firstText(elms: ElementItem[]): string {
    const t = elms.find((e) => e.kind === "text") as { id: string; kind: "text"; text?: string } | undefined;
    return (t?.text ?? "").trim();
}

function preview(txt: string) {
    return (txt || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export const ManagementBuilder = ({
    values,
    handleChange,
    onChange,
    promptId,
    version,
    onVersionChange,
    onConflict,
    initialItems = [], // ← ahora esperamos steps desde BD
}: ManagementBuilderProps) => {
    // Estado interno: steps (cada card = 1 step con 1 text element)
    const [steps, setSteps] = useState<ManagementItem[]>(
        Array.isArray(initialItems) && initialItems.length > 0
            ? (initialItems as ManagementItem[])
            : []
    );

    // Conflicto: rehidrata steps desde servidor
    const stableOnConflict = useCallback(
        (serverState: any) => {
            const serverSteps = serverState?.sections?.management?.steps ?? [];
            setSteps(serverSteps);
            onConflict?.(serverState);
        },
        [onConflict]
    );

    // AUTOSAVE: sections.management.steps
    useManagementAutosave({
        promptId,
        version,
        steps,
        onVersionChange,
        onConflict: stableOnConflict,
    });

    // Construye un preview string (como products) para values.management
    const managementPreview = useMemo(() => {
        if (!steps?.length) return "";
        return steps
            .map((s) => {
                const text = firstText(s.elements);
                const header = s.title?.trim() ? `### ${s.title.trim()}\n` : "";
                return `${header}${text}`;
            })
            .join("\n\n");
    }, [steps]);

    // SYNC con parent (igual patrón que ProductBuilder)
    useEffect(() => {
        if (onChange) {
            const first = steps[0];
            onChange({
                mainMessage: first ? firstText(first.elements) : "",
                elements: (first?.elements ?? []) as ElementItem[],
            });
        }

        if (values.management !== managementPreview) {
            handleChange("management")({
                target: { value: managementPreview },
            } as ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [managementPreview, steps]);

    // Mutadores
    const addFragment = (snippet = "Nuevo fragmento de gestión…") =>
        setSteps((prev) => [
            ...prev,
            {
                id: nanoid(),
                title: extractTitle(snippet),
                mainMessage: "",
                elements: [
                    { id: nanoid(), kind: "text", text: snippet } as ElementItem,
                ],
            },
        ]);

    const removeFragment = (id: string) =>
        setSteps((prev) => prev.filter((s) => s.id !== id));

    const handleInsertFromPicker = (snippet: string) => {
        addFragment(snippet);
    };

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2 flex items-center justify-between gap-2 flex-row">
                <CardTitle className="text-base">Gestión</CardTitle>
                <div className="flex items-center gap-2">
                    {typeof ManagementPromptBuilder !== "undefined" && (
                        <ManagementPromptBuilder onInsert={handleInsertFromPicker} />
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {steps.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No has agregado fragmentos. Usa “Agregar fragmento” para comenzar.
                    </div>
                ) : (
                    <ul className="w-full rounded-xl border border-border bg-card/60 divide-y divide-border">
                        {steps.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/60">
                                <span className="truncate text-sm font-medium">
                                    {s.title?.trim() || "Fragmento"}
                                </span>

                                <Button
                                    aria-label="Eliminar"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeFragment(s.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}

                        {steps.length === 0 && (
                            <li className="p-3 text-sm text-muted-foreground">Sin elementos</li>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};