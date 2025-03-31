'use client';

import { useEffect, useState } from "react";
import { createInstance, eliminarInstancia, verificarInstanciaActiva } from "@/actions/api-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function FormInstance({ userId }: { userId: string }) {
  const [instanceName, setInstanceName] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [instanceExists, setInstanceExists] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

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
        setInstanceExists(true);
        setInstanceName("");
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

  const handleDelete = async () => {
    setDeleteLoading(true);
    setMessage(null);

    try {
      const result = await eliminarInstancia(userId);
      setMessage(result.message);

      if (result.success) {
        toast.success("Instancia eliminada correctamente");
        setInstanceExists(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      setMessage("Hubo un error al procesar la solicitud de eliminación.");
      toast.error("Hubo un error al procesar la solicitud de eliminación.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {instanceExists && (
            <>
              <div className="flex items-center">
                <p className="mr-2">Instancia</p>
                <p className="font-medium text-lg">| {instanceName}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente tu instancia.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardTitle>
      </CardHeader>

      {!instanceExists && (
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
      )}

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