'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Workflow } from "@prisma/client";
import { createRR } from "@/actions/rr-actions";
import { toast } from "sonner";

interface AutoReplies {
    user: User;
    Workflows: Workflow[];
    onSuccessClose?: () => void;
};

export const CardCreateRr = ({ user, Workflows, onSuccessClose }: AutoReplies) => {
    const router = useRouter();
    const [phrase, setPhrase] = useState("");
    const [name, setName] = useState("");
    const [workflowId, setWorkflowId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phrase) return toast.warning("El mensaje es obligatorio.");

        setLoading(true);
        const toastId = "respuesta-rapida";

        try {
            const res = await createRR({
                workflowId: workflowId || undefined,
                name: name.trim() || undefined,
                mensaje: phrase,
                userId: user.id,
            });

            if (!res.success) {
                toast.error(res.message, { id: toastId });
                return;
            }
            toast.success(res.message, { id: toastId });
            router.refresh();
            onSuccessClose?.();
        } catch (error) {
            toast.error(`Error del servidor: ${error}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="name" className="flex gap-1 items-center">
                        Nombre / atajo{" "}
                        <p className="text-xs text-muted-foreground">(Opcional — ej: bienvenida)</p>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                            /
                        </span>
                        <Input
                            id="name"
                            placeholder="bienvenida"
                            value={name}
                            onChange={(e) => setName(e.target.value.replace(/\s/g, "").toLowerCase())}
                            disabled={loading}
                            className="pl-6"
                        />
                    </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="phrase" className="flex gap-1 items-center">
                        Mensaje <p className="text-xs text-primary">(Obligatorio)</p>
                    </Label>
                    <Textarea
                        id="phrase"
                        placeholder="Ej: Fue un gusto atenderte."
                        value={phrase}
                        onChange={(e) => setPhrase(e.target.value)}
                        disabled={loading}
                        rows={4}
                    />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="workflow" className="flex gap-1 items-center">
                        Selecciona el flujo{" "}
                        <p className="text-xs text-muted-foreground">(Opcional)</p>
                    </Label>
                    <Select
                        onValueChange={(val) => setWorkflowId(val)}
                        disabled={loading}
                    >
                        <SelectTrigger id="workflow">
                            <SelectValue placeholder="Sin flujo asociado" />
                        </SelectTrigger>
                        <SelectContent>
                            {Workflows.map((wf) => (
                                <SelectItem key={wf.id} value={wf.id}>
                                    {wf.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex mt-4 gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Guardando..." : "Crear"}
                </Button>
            </div>
        </form>
    );
};
