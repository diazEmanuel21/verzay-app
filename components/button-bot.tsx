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
  apiurl: string;
  apikey: string;
  webhookUrl: string;
}

const EnableToggleButton: React.FC<EnableToggleButtonProps> = ({
  userId,
  userName,
  apiurl,
  apikey,
  webhookUrl
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<{
    instanceName: string;
    instanceId: string;
    serverUrl: string;
  } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadInstanceData = async () => {
    try {
      const instances = await getInstances(userId);
      if (instances && instances.length > 0) {
        const whatsappInstance = instances.findIndex(i => i.instanceType == 'Whatsapp')
        const { instanceName, instanceId,serverUrl } = instances[whatsappInstance];
        // console.log('Datos de activacion',{ instanceName, instanceId,serverUrl })
        // const { instanceName, instanceId, serverUrl } = instances[0];
        setInstanceData({ instanceName, instanceId, serverUrl });
        await fetchWebhookStatus(instanceName, instanceId, serverUrl);
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

  const baseUrl = "https://" + instanceData?.serverUrl;

  const fetchWebhookStatus = async (
    instanceName: string,
    instanceId: string,
    serverUrl: string
  ) => {
    try {
      const response = await fetch(
        `https://${serverUrl}/webhook/find/${instanceName}`,
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
        `https://${instanceData.serverUrl}/webhook/set/${instanceData.instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: instanceData.instanceId,
          },
          body: JSON.stringify({
            webhook: {
              enabled: !isEnabled,
              // url: `https://n8npro.verzay.co/webhook/${userName}`,
              url: webhookUrl,
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
    <>
      {/* BOTÓN DE ENCENDIDO */}
      {!isEnabled ? (
        <Button
          onClick={toggleEnable}
          disabled={loading || !instanceData}
          className="bg-green-600 hover:bg-green-700 w-full"
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
              Activar
            </>
          )}
        </Button>
      ) : (
        // BOTÓN DE APAGADO CON ALERT DIALOG
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              disabled={loading || !instanceData}
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
                  Apagar
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
    </>
  );
};

export default EnableToggleButton;