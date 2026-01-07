'use client';

import { Button } from "@/components/ui/button";
import { PremiumModule } from "@/components/shared/PremiumModule";
import { Plan } from '@prisma/client';
import { Action } from "@/types/workflow-node";

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
    // const isSeguimiento = action.type === 'seguimiento' || action.type.startsWith('seguimiento-');
    const Icon = action.icon;

    return (
        <Button
            variant="outline"
            className={`flex`}
            draggable={!disabled}
            onDragStart={(e) => onDragStart(e, action)}
            disabled={disabled}
            title={disabled ? 'Límite alcanzado o acción deshabilitada' : 'Arrastra para crear en el canvas'}
        >
            <Icon className={action.iconClassName ?? "!h-3 !w-3"} />
            <div className="flex flex-1">
                {action.label}
            </div>
            {/* {isSeguimiento && <PremiumModule />} */}
        </Button>
    );
}