'use client';

import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Workflow, rr } from "@prisma/client";
import { createRR, getAllRRs, updateRR } from "@/actions/rr-actions";
import { toast } from "sonner";
import Link from "next/link";
import { ShuffleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: User;
  Workflows: Workflow[];
}

export const MainAutoReplies = ({ user, Workflows }: Props) => {
  const [phrase, setPhrase] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [existingRR, setExistingRR] = useState<rr | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRR = async () => {
      if (!workflowId) return;

      const res = await getAllRRs(workflowId);

      if (!res.success || !res.data) {
        setExistingRR(null);
        setPhrase("");
        return;
      }

      // 🔍 Manejar ambas formas: rr[] o rr
      const mensajeExistente = Array.isArray(res.data)
        ? res.data[0]
        : res.data;

      if (mensajeExistente) {
        setExistingRR(mensajeExistente);
        setPhrase(mensajeExistente.mensaje ?? "");
      } else {
        setExistingRR(null);
        setPhrase("");
      }
    };

    loadRR();
  }, [workflowId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase || !workflowId) return toast.warning("Debes completar todos los campos.");

    setLoading(true);
    const toastId = "respuesta-rapida";

    try {
      let res;
      if (existingRR) {
        res = await updateRR(existingRR.id, { mensaje: phrase });
      } else {
        res = await createRR({ workflowId, mensaje: phrase, userId: user.id });
      }

      if (!res.success) {
        toast.error(res.message, { id: toastId });
        return;
      }

      toast.success(res.message, { id: toastId });
      setExistingRR(res.data as rr);
    } catch (error) {
      toast.error(`Error del servidor: ${error}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Respuesta rápida</CardTitle>
          <CardDescription>
            {existingRR ? "Edita la respuesta para este flujo" : "Crea una nueva respuesta rápida"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phrase">
                  Mensaje automático <strong>(Obligatorio)</strong>
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
                <Label htmlFor="workflow">
                  Selecciona el flujo <strong>(Obligatorio)</strong>
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
            <CardFooter className="flex mt-4 gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Guardando..."
                  : existingRR
                    ? "Actualizar"
                    : "Crear"}
              </Button>
              {existingRR &&
                <Link href={`flow/${workflowId}`} className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "sm"
                  }),
                  "flex items-center gap-2"
                )}>
                  <ShuffleIcon size={16} />
                  Abrir
                </Link>
              }
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
