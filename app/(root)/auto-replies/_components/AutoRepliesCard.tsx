"use client";

import { useState } from "react";
import { rr, Workflow } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AutoRepliesActions } from "./";
import { MessageCircleMoreIcon, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateRR } from "@/actions/rr-actions";
import { toast } from "sonner";

interface autoReplies {
    autoReplie: rr;
    workflows: Workflow[];
}

export const AutoRepliesCard = ({ autoReplie, workflows }: autoReplies) => {
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
                                <PencilIcon
                                    size={16}
                                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                />
                            </div>
                        )}

                        {/* Workflows asociados */}
                        {relatedWorkflows.length > 0 && (
                            <div className="flex gap-1 flex-wrap pt-1">
                                {relatedWorkflows.map((wf) => (
                                    <Badge key={wf.id} variant="secondary" className="text-xs">
                                        {wf.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                    <AutoRepliesActions
                        mensaje={autoReplie.mensaje ?? ""}
                        autoReplieId={autoReplie.id}
                        workflowId={relatedWorkflows[0].id}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
