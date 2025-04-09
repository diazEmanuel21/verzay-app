import { Action } from '../types';
import { Button } from "@/components/ui/button";
import { PremiumModule } from "@/components/shared/PremiumModule";
import { Role } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface actionpopover {
    action: Action;
    onClick: () => void;
    disabled: boolean;
    role: Role;
}

export const ActionPopoverButton = ({
    action,
    onClick,
    disabled,
    role
}: actionpopover) => {
    const router = useRouter();
    const isSeguimiento = action.type === 'seguimiento' || action.type.startsWith('seguimiento-');
    const isPremium = role === 'empresarial';

    const handleSeguimiento = () => {
        if (isSeguimiento && !isPremium) return router.push('/credits');
        onClick();
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={handleSeguimiento}
                className="flex items-center justify-between gap-2 text-sm w-full"
                disabled={disabled}
            >
                <span className="flex flex-row gap-2">
                    {action.icon}
                    {action.label}
                </span>
                {isSeguimiento && <PremiumModule />}
            </Button>
        </>
    );
}

