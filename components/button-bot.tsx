"use client";
import { useEffect, useState } from "react";
// Importamos Switch y Label
import { Switch } from "./ui/switch"; 
import { Label } from "@/components/ui/label"; 
// Mantenemos Button para el AlertDialogAction
import { Button } from "@/components/ui/button"; 
import {
  AlertDialog,
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
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true); 
  const [isToggling, setIsToggling] = useState<boolean>(false);
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
        const { instanceName, instanceId, serverUrl } = instances[whatsappInstance];
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
      setIsLoadingData(false);
    }
  };

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

  const toggleEnable = async (newState?: boolean) => {
    const stateToToggle = newState !== undefined ? newState : !isEnabled;
    if (!instanceData) {
      toast.error("No se encontró información de la instancia.");
      if (newState === false) setIsEnabled(true); 
      return;
    }

    setIsToggling(true);
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
              enabled: stateToToggle,
              url: webhookUrl,
              base64: true,
              events: ["MESSAGES_UPSERT"],
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Error al cambiar el estado.");

      setIsEnabled(stateToToggle);

      if (stateToToggle) {
        toast.success("Robot encendido correctamente.");
      } else {
        toast.warning("Robot apagado correctamente.");
      }
    } catch (err) {
      const errorMessage = `Error al cambiar el estado: ${err instanceof Error ? err.message : String(err)
        }`;
      setError(errorMessage);
      toast.error(errorMessage);
      setIsEnabled(!stateToToggle); 
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    if (isLoadingData || !instanceData || isToggling) return;

    if (checked) {
      toggleEnable(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    loadInstanceData();
  }, [userId]);

  const isDisabled = isLoadingData || !instanceData || isToggling;

  // Renderizamos el error si existe
  if (error && !instanceData) {
    return (
        <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  // ---------------------------------------------------------------------
  // RENDERIZADO ULTRA MINIMALISTA
  // ---------------------------------------------------------------------
  return (
    // Contenedor minimalista con flex-col para Switch arriba y estado abajo
    <div className="flex flex-col items-center justify-center w-full min-w-[70px]"> 
        
        {/* Switch o Loader */}
        {isLoadingData || isToggling || isEnabled === null ? (
            <Loader2 className="animate-spin w-6 h-6 text-primary mb-1" />
        ) : (
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Switch
                    id="robot-toggle"
                    checked={isEnabled}
                    onCheckedChange={handleToggleChange}
                    disabled={isDisabled}
                    // Clases para darle color Verde/Rojo al switch
                    className="
                        data-[state=checked]:bg-green-600 
                        data-[state=unchecked]:bg-secondary
                        disabled:bg-gray-400
                        h-6 
                    "
                />

                {/* AlertDialog de Confirmación (mantenido) */}
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto apagará el Robot de la instancia. Las respuestas automáticas se detendrán hasta que vuelvas a encenderlo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsDialogOpen(false);
                            setIsEnabled(true); 
                        }}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                setIsDialogOpen(false);
                                await toggleEnable(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isToggling}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        
        {/* Indicador de estado debajo del Switch */}
        {/* <span className={`text-xs mt-1 font-semibold leading-none ${isEnabled ? 'text-green-600' : 'text-red-600'} ${isLoadingData || isToggling ? 'text-muted-foreground' : ''}`}>
             {isLoadingData || isToggling
                ? "Loading..." // Muestra 'Loading...' mientras se carga o se cambia el estado
                : isEnabled ? "Activado" : "Desactivado"
             }
        </span> */}
    </div>
  );
};

export default EnableToggleButton;