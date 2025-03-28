'use client'

import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    userId: string
    checked: boolean
};

export const SwitchStatus = ({ userId, checked }: Props) => {
    const [localChecked, setLocalChecked] = useState(checked);

    const handleUpdateClientStatus = (id: string, status: boolean) => {
        const toastId = 'upating-client';
        toast.loading('Actualizando estado del cliente...', { id: toastId });

        console.log(`Cliente ${id} actualizado a ${status ? 'activo' : 'inactivo'}`);
        setLocalChecked(status);
        // Aquí puedes llamar a tu API para actualizar el estado del cliente.

        setTimeout(() => {
            toast.success('Actualizado!', { id: toastId })
        }, 2000);
    };

    return (
        <Switch
            checked={localChecked}
            onCheckedChange={(checked) => handleUpdateClientStatus(userId, checked)}
        />
    )
};
