"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Power } from "lucide-react";
import { getInstances } from "@/actions/api-action";
import { toast } from "sonner";

interface EnableToggleButtonProps {
  userId: string;
  userName?: string | null;
}

const EnableToggleButton: React.FC<EnableToggleButtonProps> = ({
  userId,
  userName,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<{
    instanceName: string;
    instanceId: string;
  } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const baseUrl = "https://conexion-1.verzay.co";

  const loadInstanceData = async () => {
    try {
      const instances = await getInstances(userId);
      if (instances && instances.length > 0) {
        const { instanceName, instanceId } = instances[0];
        setInstanceData({ instanceName, instanceId });
        await fetchWebhookStatus(instanceName, instanceId);
      } else {
        setError("No se encontraron instancias para este usuario.");
      }
    } catch (err) {
      setError(
        `Error al cargar las instancias: ${err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookStatus = async (
    instanceName: string,
    instanceId: string
  ) => {
    try {
      const response = await fetch(
        `${baseUrl}/webhook/find/${instanceName}`,
        {
          method: "GET",
          headers: { apikey: instanceId },
        }
      );

      if (!response.ok)
        throw new Error("Error al obtener el estado del webhook.");

      const data = await response.json();

      if (data === null || data.enabled === undefined) {
        setIsEnabled(false);
      } else {
        setIsEnabled(data.enabled);
      }
    } catch (err) {
      setError(
        `Error al obtener el estado del webhook: ${err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const toggleEnable = async () => {
    if (!instanceData) {
      toast.error("No se encontró información de la instancia.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${baseUrl}/webhook/set/${instanceData.instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: instanceData.instanceId,
          },
          body: JSON.stringify({
            webhook: {
              enabled: !isEnabled,
              url: `https://n8npro.verzay.co/webhook/${userName}`,
              base64: true,
              events: ["MESSAGES_UPSERT"],
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Error al cambiar el estado.");

      const newState = !isEnabled;
      setIsEnabled(newState);

      if (newState) {
        toast.success("Robot encendido correctamente.");
      } else {
        toast.warning("Robot apagado correctamente.");
      }
    } catch (err) {
      const errorMessage = `Error al cambiar el estado: ${err instanceof Error ? err.message : String(err)
        }`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstanceData();
  }, [userId]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col items-center justify-center w-full">
        {/* Alerta de error */}
        {error && (
          <Alert variant="destructive" className="w-full max-w-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* BOTÓN DE ENCENDIDO */}
        {!isEnabled ? (
          <Button
            onClick={toggleEnable}
            disabled={loading || !instanceData}
            className="flex items-center gap-2 w-full max-w-xs justify-center py-6 rounded-xl text-base font-semibold transition-all"
            variant="default"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Encendiendo...
              </>
            ) : (
              <>
                <Power className="w-6 h-6" />
                Encender Robot
              </>
            )}
          </Button>
        ) : (
          // BOTÓN DE APAGADO CON ALERT DIALOG
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={loading || !instanceData}
                className="flex items-center gap-2 w-full max-w-xs justify-center py-6 rounded-xl text-base font-semibold transition-all"
                variant="destructive"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <Power className="w-6 h-6" />
                    Apagar Robot
                  </>
                )}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto apagará el Robot de la instancia. Las respuestas
                  automáticas se detendrán hasta que vuelvas a encenderlo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setIsDialogOpen(false);
                    await toggleEnable();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Estado actual en texto */}

      </div>
      {/* <p
        className={`text-sm ${isEnabled
            ? "text-green-600 font-medium"
            : "text-red-600 font-medium"
          }`}
      >
        {isEnabled === null
          ? "Estado desconocido"
          : isEnabled
            ? "Robot ACTIVO"
            : "Robot APAGADO"}
      </p> */}
    </div>
  );
};

export default EnableToggleButton;