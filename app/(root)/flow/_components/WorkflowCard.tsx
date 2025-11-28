"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PencilLine, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { updateWorkflow } from "@/actions/workflow-actions";
import { WorkflowAction } from "./";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workflowShema } from "@/lib/zod";
import { z } from "zod";

type MatchType = "Exacta" | "Contiene";

export const WorkflowCard = ({
    workflow,
    userId,
}: {
    workflow: Workflow;
    userId: string;
}) => {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- Parseamos el description para obtener keyword y matchType ---
    let initialKeyword = "";
    let initialMatchType: MatchType = "Exacta";

    if (workflow.description) {
        try {
            const parsed = JSON.parse(workflow.description);
            if (parsed && typeof parsed === "object" && "keyword" in parsed) {
                initialKeyword = parsed.keyword ?? "";
                if (parsed.matchType === "Exacta" || parsed.matchType === "Contiene") {
                    initialMatchType = parsed.matchType;
                }
            } else {
                initialKeyword = workflow.description;
            }
        } catch {
            // No es JSON, usamos el texto tal cual
            initialKeyword = workflow.description;
        }
    }

    const [matchType, setMatchType] = useState<MatchType>(initialMatchType);

    const form = useForm<z.infer<typeof workflowShema>>({
        resolver: zodResolver(workflowShema),
        defaultValues: {
            name: workflow.name.toUpperCase() ?? "",
            description: initialKeyword ?? "",
        },
    });

    // Para mostrar la palabra clave "bonita" en modo lectura
    const getDescriptionLabel = () => {
        if (!workflow.description) return "Sin palabra clave";

        try {
            const parsed = JSON.parse(workflow.description);
            if (parsed && typeof parsed === "object" && "keyword" in parsed) {
                return parsed.keyword || "Sin palabra clave";
            }
        } catch {
            // No es JSON, devolvemos el texto tal cual
            return workflow.description;
        }

        return workflow.description;
    };

    const handleSubmit = form.handleSubmit(async (values) => {
        // Armamos el JSON que se guardará en description
        const descriptionJson = values.description
            ? JSON.stringify({
                matchType,
                keyword: values.description.trim() || "",
            })
            : "";

        const nameChanged = values.name !== workflow.name.toUpperCase();
        const descChanged = descriptionJson !== (workflow.description ?? "");

        if (!nameChanged && !descChanged) {
            setEditing(false);
            return;
        }

        setLoading(true);
        const toastId = `workflow-${workflow.id}`;
        try {
            const res = await updateWorkflow(workflow.id, {
                name: values.name.toUpperCase(),
                description: descriptionJson,
            });

            if (!res.success) {
                toast.error(res.message, { id: toastId });
                form.reset(); // restore old values
            } else {
                toast.success("Flujo actualizado correctamente", { id: toastId });
            }
        } catch {
            toast.error("Error al actualizar el flujo", { id: toastId });
            form.reset();
        } finally {
            setLoading(false);
            setEditing(false);
            router.refresh();
        }
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === "Enter") handleSubmit();
        if (e.key === "Escape") {
            form.reset();
            setEditing(false);
        }
    };

    return (
        <Card className="border-border">
            <CardContent className="p-4 flex flex-1 gap-2 items-center justify-between">
                <div className="flex flex-1 gap-4 justify-center items-center">
                    <div
                        className="w-10 h-10 rounded-sm flex items-center justify-center bg-blue-500 cursor-pointer"
                        onClick={() => router.push(`flow/${workflow.id}`)}
                    >
                        <FileTextIcon />
                    </div>

                    <div className="flex flex-col flex-1 gap-2">
                        {editing ? (
                            <Form {...form}>
                                <form
                                    onSubmit={handleSubmit}
                                    onBlur={handleSubmit}
                                    className="flex gap-2 flex-col"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Nombre del flujo"
                                                        className="text-base uppercase font-semibold "
                                                        disabled={loading}
                                                        onKeyDown={handleKeyDown}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Select "Exacta / Contiene" (fantasma) */}
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={matchType}
                                            onChange={(e) =>
                                                setMatchType(e.target.value as MatchType)
                                            }
                                            onKeyDown={handleKeyDown}
                                            disabled={loading}
                                            className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="Exacta">Exacta</option>
                                            <option value="Contiene">Contiene</option>
                                        </select>
                                        <span className="text-[11px] text-muted-foreground">
                                            Tipo de coincidencia
                                        </span>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Palabra clave del flujo"
                                                        className="text-sm text-muted-foreground"
                                                        disabled={loading}
                                                        onKeyDown={handleKeyDown}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        ) : (
                            <>
                                <div
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => setEditing(true)}
                                >
                                    <h3 className="text-base font-semibold text-muted-foreground group-hover:underline">
                                        {workflow.name.toUpperCase()}
                                    </h3>
                                    <PencilLine className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition" />
                                </div>
                                <div
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => setEditing(true)}
                                >
                                    <p className="text-sm text-muted-foreground group-hover:underline">
                                        {getDescriptionLabel()}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center">
                    <WorkflowAction
                        workflowName={workflow.name.toUpperCase()}
                        workflowId={workflow.id}
                        userId={userId}
                    />
                </div>
            </CardContent>
        </Card>
    );
};