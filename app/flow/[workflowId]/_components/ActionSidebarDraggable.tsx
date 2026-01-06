'use client';

import { Action } from '../types';
import { Button } from "@/components/ui/button";
import { PremiumModule } from "@/components/shared/PremiumModule";
import { Plan } from '@prisma/client';

type Props = {
    action: Action;
    disabled?: boolean;
    onDragStart: (e: React.DragEvent, action: Action) => void;
};

export const ActionSidebarDraggable = ({
    action,
    disabled,
    onDragStart,
}: Props) => {
    const isSeguimiento = action.type === 'seguimiento' || action.type.startsWith('seguimiento-');

    return (
        <Button
            variant="outline"
            className={`flex items-center justify-between gap-2 text-sm w-full ${isSeguimiento ? 'bg-blue-100 hover:bg-blue-200' : ''
                }`}
            draggable={!disabled}
            onDragStart={(e) => onDragStart(e, action)}
            disabled={disabled}
            title={disabled ? 'Límite alcanzado o acción deshabilitada' : 'Arrastra para crear en el canvas'}
        >
            <span className="flex flex-row gap-2 items-center">
                {action.icon}
                {action.label}
            </span>

            {isSeguimiento && <PremiumModule />}
        </Button>
    );
}
