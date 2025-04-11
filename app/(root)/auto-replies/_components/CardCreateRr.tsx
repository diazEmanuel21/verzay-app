'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
};

export const CardCreateRr = ({ user, Workflows }: AutoReplies) => {
    const router = useRouter();
    const [phrase, setPhrase] = useState("");
    const [workflowId, setWorkflowId] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phrase || !workflowId) return toast.warning("Debes completar todos los campos.");

        setLoading(true);
        const toastId = "respuesta-rapida";

        try {
            let res = await createRR({ workflowId, mensaje: phrase, userId: user.id });

            if (!res.success) {
                toast.error(res.message, { id: toastId });
                return;
            }

            toast.success(res.message, { id: toastId });
            router.refresh();
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
                    <Label htmlFor="phrase" className="flex gap-1 items-center">
                        Mensaje automático <p className="text-xs text-primary">(Obligatorio)</p>
                    </Label>
                    <Input
                        id="phrase"
                        placeholder="Ej: Fue un gusto."
                        value={phrase}
                        onChange={(e) => setPhrase(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="workflow" className="flex gap-1 items-center">
                        Selecciona el flujo <p className="text-xs text-primary">(Obligatorio)</p>
                    </Label>
                    <Select
                        onValueChange={(val) => setWorkflowId(val)}
                        disabled={loading}
                    >
                        <SelectTrigger id="workflow">
                            <SelectValue placeholder="Selecciona un flujo" />
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
                    {loading ? "Guardando..." : 'Crear'}
                </Button>
            </div>
        </form>
    )
}
