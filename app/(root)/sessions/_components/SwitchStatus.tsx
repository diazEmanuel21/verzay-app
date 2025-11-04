'use client'

import { useState } from "react";
import { updateSessionStatus } from "@/actions/session-action";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
  sessionId: number;
  checked: boolean;
  mutateSessions?: (updater: (prevData: any) => any, shouldRevalidate?: boolean) => void; 
};

export const SwitchStatus = ({ sessionId, checked, mutateSessions }: Props) => {
  const [localChecked, setLocalChecked] = useState(checked);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateClientStatus = async (status: boolean) => {
    const previous = localChecked;
    setLocalChecked(status);
    setIsLoading(true);

    const toastId = 'updating-client';
    toast.loading('Actualizando estado del cliente...', { id: toastId });

    const result = await updateSessionStatus(sessionId, status);

    if (result.success) {
      toast.success('Actualizado!', { id: toastId });

      // Mutar datos manualmente para evitar rebote
      if (mutateSessions) {
        mutateSessions((prev: any) => {
          if (!prev) return prev;
          return prev.map((page: any) =>
            page.map((session: any) => {
              if (session.id === sessionId) {
                return { ...session, status: status };
              }
              return session;
            })
          );
        }, false); // false = no revalidar de nuevo
      }
    } else {
      toast.error(result.message || 'Error al editar cliente', { id: toastId });
      setLocalChecked(previous); // Revertir si falla
    }

    setIsLoading(false);
  };

  return (
    <Switch
      checked={localChecked}
      disabled={isLoading}
      onCheckedChange={handleUpdateClientStatus}
      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400" // Esto sobrescribiría primary
    />
  );
};
