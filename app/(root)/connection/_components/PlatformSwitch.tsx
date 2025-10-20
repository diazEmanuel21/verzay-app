// PlatformSwitch.tsx (Componente de Cliente)
'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch'; // Asegúrate de la ruta correcta
import { toggleUserPlatform } from '@/actions/api-action'; // 👈 Asegúrate de la ruta correcta a tu server action
import { toast } from 'sonner';

interface PlatformSwitchProps {
    userId: string;
    platform: 'Facebook' | 'Instagram';
    initialState: boolean;
}

export const PlatformSwitch = ({ userId, platform, initialState }: PlatformSwitchProps) => {
    const [isChecked, setIsChecked] = useState(initialState);
    const [isPending, startTransition] = useTransition();

    const handleToggle = (newCheckedState: boolean) => {
        setIsChecked(newCheckedState); // Actualización optimista (asume que va a funcionar)
        
        startTransition(async () => {
            const result = await toggleUserPlatform(userId, platform, newCheckedState);
            
            if (result.success) {
                toast.success(result.message);
            } else {
                // Revertir el estado si la acción del servidor falla
                setIsChecked(!newCheckedState);
                toast.error(result.message);
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Switch
                checked={isChecked}
                onCheckedChange={handleToggle}
                disabled={isPending}
                id={`switch-${platform}`}
            />
            {/* <span className={`text-sm font-medium ${isChecked ? 'text-green-600' : 'text-red-600'}`}>
                {isChecked ? 'Activo' : 'Desactivado'}
            </span> */}
            {isPending && <span className="text-xs text-gray-500"></span>}
        </div>
    );
};