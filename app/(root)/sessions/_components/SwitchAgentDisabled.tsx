'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { toggleAgentDisabled } from '@/actions/session-action';

type Props = {
    agentDisabled: boolean;
    userId: string;
    sessionId: number;
    mutateSessions: () => void;
};

export const SwitchAgentDisabled = ({ agentDisabled, userId, sessionId, mutateSessions }: Props) => {
    const [checked, setChecked] = useState(!agentDisabled);
    const [isPending, startTransition] = useTransition();

    const onChange = (nextChecked: boolean) => {
        const prev = checked;
        setChecked(nextChecked);

        startTransition(async () => {
            // DB: agentDisabled = !checked
            const res = await toggleAgentDisabled(userId, sessionId, !nextChecked);

            if (!res?.success) {
                setChecked(prev);
                toast.error(res?.message || 'No se pudo actualizar el agente.');
                return;
            }

            mutateSessions();
            toast.success(nextChecked ? 'Agente habilitado para esta sesión.' : 'Agente deshabilitado para esta sesión.');
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Switch checked={checked} onCheckedChange={onChange} disabled={isPending} />
            <span className="text-xs text-muted-foreground">{checked ? 'ON' : 'OFF'}</span>
        </div>
    );
}