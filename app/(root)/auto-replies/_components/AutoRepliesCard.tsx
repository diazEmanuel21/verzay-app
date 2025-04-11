"use client";

import { useState } from "react";
import { rr, Workflow } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="flex justify-center">
            <Card className="w-full max-w-xl shadow-xl">
                <CardContent className="flex flex-col items-center text-center p-8">
                    <h1 className="text-2xl font-bold mb-2">
                        🚧 ¡Algo increíble está por llegar!
                    </h1>
                    <p className="text-muted-foreground text-sm mb-4">
                        Estamos desarrollando una nueva funcionalidad de <b>respuesta rápida</b> con envío de archivos adjuntos, además de <b>seguimientos inteligentes</b> impulsados por inteligencia artificial que conservan el contexto    .
                        <br /><br />
                        Muy pronto tendrás acceso a herramientas que potenciaran tu negocio como nunca antes lo habia experimentado.
                    </p>
                    <span className="text-xs text-gray-400">Verzay a tu servicio. 2025 💜</span>
                </CardContent>
            </Card>
        </div>
    );
};
