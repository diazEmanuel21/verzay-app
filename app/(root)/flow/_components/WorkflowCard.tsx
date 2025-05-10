"use client";

import React, { useState } from "react";
import { Workflow } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircleMoreIcon, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { WorkflowAction } from "./WorkflowAction";

export const WorkflowCard = ({
    workflow,
    userId,
}: {
    workflow: Workflow;
    userId: string;
}) => {

    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [mensaje, setMensaje] = useState(workflow.description ?? "");
    const [loading, setLoading] = useState(false);


    const handleSave = async () => {
        if (mensaje === workflow.description) {
            setEditing(false);
            return;
        }

        setLoading(true);
        const toastId = `workflow-${workflow.id}`;

        // try {
        //     const res = await updateRR(workflow.id, { mensaje });

        //     if (!res.success) {
        //         toast.error(res.message, { id: toastId });
        //         setMensaje(workflow.mensaje ?? "");
        //     } else {
        //         toast.success("Mensaje actualizado", { id: toastId });
        //     }
        // } catch (error) {
        //     toast.error("Error al actualizar", { id: toastId });
        //     setMensaje(workflow.mensaje ?? "");
        // } finally {
        //     setLoading(false);
        //     setEditing(false);
        // }
    };

    return (
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 flex items-center justify-between h-[100px]">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent">
                        <MessageCircleMoreIcon />
                    </div>
                    <div className="flex flex-col">
                        {/* Edición inline */}
                        {editing ? (
                            <Input
                                autoFocus
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSave();
                                    if (e.key === "Escape") {
                                        setMensaje(workflow.description ?? "");
                                        setEditing(false);
                                    }
                                }}
                                disabled={loading}
                                className="text-sm"
                            />
                        ) : (
                            <div
                                className="flex items-center gap-1 cursor-pointer group"
                                onClick={() => setEditing(true)}
                            >
                                <h3 className="text-base font-bold text-muted-foreground group-hover:underline">
                                    {mensaje}
                                </h3>
                                <PencilLine
                                    color="#1C61E7"
                                    size={16}
                                    className="text-muted-foreground"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                            {/* <span className="text-xs text-muted-foreground">Flujo asociado:</span> */}

                        </div>

                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                    <WorkflowAction
                        workflowName={workflow.name}
                        workflowId={workflow.id}
                        userId={userId}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
