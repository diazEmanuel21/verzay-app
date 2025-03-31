'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSessionStatus } from "@/actions/session-action";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
    sessionId: number
    checked: boolean
};

export const SwitchStatus = ({ sessionId, checked }: Props) => {
    const router = useRouter();

    const [localChecked, setLocalChecked] = useState(checked);

    const handleUpdateClientStatus = async (status: boolean) => {
        setLocalChecked(status);

        const toastId = 'upating-client';
        toast.loading('Actualizando estado del cliente...', { id: toastId });

        const result = await updateSessionStatus(sessionId, status);

        if (result.success) {
            toast.success('Actualizado!', { id: toastId });
            router.refresh();
        } else {
            toast.error(result.message || 'Error al editar cliente', { id: toastId });
        }
    };

    return (
        <Switch
            checked={localChecked}
            onCheckedChange={(status) => handleUpdateClientStatus(status)}
        />
    )
};
