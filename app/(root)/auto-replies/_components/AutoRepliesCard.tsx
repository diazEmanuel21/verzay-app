"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuickReply, Workflow } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { AutoRepliesActions } from "./";
import { MessageCircleMoreIcon, PencilLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateRR } from "@/actions/rr-actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface autoReplies {
    autoReplie: QuickReply;
    workflows: Workflow[];
}

export const AutoRepliesCard = ({ autoReplie, workflows }: autoReplies) => {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [mensaje, setMensaje] = useState(autoReplie.mensaje ?? "");
    const [loading, setLoading] = useState(false);

    const relatedWorkflows = workflows.filter(
        (wf) => wf.id === autoReplie.workflowId
    );

    const handleSave = async () => {
        if (mensaje === autoReplie.mensaje) {
            setEditing(false);
            return;
        }

        setLoading(true);
        const toastId = `rr-${autoReplie.id}`;

        try {
            const res = await updateRR(autoReplie.id, { mensaje });

            if (!res.success) {
                toast.error(res.message, { id: toastId });
                setMensaje(autoReplie.mensaje ?? "");
            } else {
                toast.success("Mensaje actualizado", { id: toastId });
            }
        } catch (error) {
            toast.error("Error al actualizar", { id: toastId });
            setMensaje(autoReplie.mensaje ?? "");
        } finally {
            setLoading(false);
            setEditing(false);
        }
    };

    return (
        <Card className="transition-all duration-300 hover:shadow-lg border-border">
            <CardContent className="p-4 flex items-center justify-between h-[100px]">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-blue-500 cursor-pointer">
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
                                        setMensaje(autoReplie.mensaje ?? "");
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
                                    size={16}
                                    className="text-blue-500"
                                />
                            </div>
                        )}

                        {/* Workflows asociados */}
                        {/* Selector de workflow asociado */}
                        <div className="flex items-center gap-2 pt-2">
                            {/* <span className="text-xs text-muted-foreground">Flujo asociado:</span> */}

                            <Select
                                value={autoReplie.workflowId}
                                onValueChange={async (newWorkflowId) => {
                                    if (newWorkflowId === autoReplie.workflowId) return;

                                    const toastId = `workflow-update-${autoReplie.id}`;
                                    toast.loading("Actualizando flujo...", { id: toastId });

                                    try {
                                        const res = await updateRR(autoReplie.id, { workflowId: newWorkflowId });
                                        if (res.success) {
                                            toast.success("Flujo actualizado correctamente", { id: toastId });
                                        } else {
                                            toast.error(res.message, { id: toastId });
                                        }
                                    } catch (err) {
                                        toast.error("Error al actualizar el flujo", { id: toastId });
                                    } finally {
                                        router.refresh();
                                    }
                                }}
                            >
                                <SelectTrigger className="h-7 rounded-md px-2 py-0 text-xs border-muted">
                                    <SelectValue placeholder="Seleccionar flujo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflows.map((wf) => (
                                        <SelectItem
                                            key={wf.id}
                                            value={wf.id}
                                            className="text-xs"
                                        >
                                            {wf.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                    <AutoRepliesActions
                        mensaje={autoReplie.mensaje ?? ""}
                        autoReplieId={autoReplie.id}
                        workflowId={relatedWorkflows[0]?.id ?? "404"}
                        workflowIsPro={relatedWorkflows[0]?.isPro ?? false}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
