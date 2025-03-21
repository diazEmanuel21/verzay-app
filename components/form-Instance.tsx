'use client';

import { useEffect, useState } from "react";
import { createInstance, verificarInstanciaActiva } from "@/actions/api-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Power, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function FormInstance({ userId }: { userId: string }) {
  const [instanceName, setInstanceName] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [instanceExists, setInstanceExists] = useState<boolean>(false);

  useEffect(() => {
    const checkInstance = async () => {
      const activeInstance = await verificarInstanciaActiva(userId);
      setInstanceExists(!!activeInstance);
      setInstanceName(activeInstance?.instanceName || "");
    };

    checkInstance();
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (instanceExists) {
      const msg = "El usuario ya tiene una instancia activa.";
      setMessage(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("instanceName", instanceName);
    formData.append("userId", userId);

    try {
      const result = await createInstance(formData);

      if (result.success) {
        toast.success(result.message);
        setMessage(result.message);

        // Aquí actualizamos el estado sin recargar
        setInstanceExists(true);
        setInstanceName(""); // Reset del input si quieres

        // Opcional: Si quieres que otros componentes se actualicen, puedes manejarlo en el padre o con un hook global
      } else {
        toast.error(result.message);
        setMessage(result.message);
      }

    } catch (error) {
      const errorMsg = "Hubo un error al procesar la solicitud.";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center">
          {instanceExists &&
            <>
              <p className="mr-2">Instancia</p>
              <p className="font-medium text-lg">| {instanceName}</p>
            </>
          }
        </CardTitle>
      </CardHeader>

      {!instanceExists &&
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="instanceName" className="block text-sm font-medium mb-1">
                Nombre de la Instancia
              </label>
              <Input
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Crear Instancia
            </Button>
          </form>
        </CardContent>
      }

      {message && (
        <CardFooter>
          <p className={`text-sm ${message.startsWith("El usuario") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        </CardFooter>
      )}
    </>
  );
}