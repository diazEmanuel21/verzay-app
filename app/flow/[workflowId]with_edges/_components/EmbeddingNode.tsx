'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import type { WorkflowNodeDB } from '@/types/workflow-node';
import { updateIntentionNodeConfig } from '@/actions/workflow-node-action';

type Props = { node: WorkflowNodeDB };

export function EmbeddingNode({ node }: Props) {
    const router = useRouter();

    const [prompt, setPrompt] = useState(node.intentionPrompt ?? '');
    const [maxAttempts, setMaxAttempts] = useState<number>(node.intentionMaxAttempts ?? 3);

    useEffect(() => {
        setPrompt(node.intentionPrompt ?? '');
        setMaxAttempts(node.intentionMaxAttempts ?? 3);
    }, [node.intentionPrompt, node.intentionMaxAttempts]);

    const savingRef = useRef(false);
    const lastSavedRef = useRef({ prompt: prompt.trim(), maxAttempts });

    const save = async () => {
        const trimmed = prompt.trim();
        const payload = { prompt: trimmed, maxAttempts };

        // evita guardar si no cambió
        if (
            lastSavedRef.current.prompt === payload.prompt &&
            lastSavedRef.current.maxAttempts === payload.maxAttempts
        ) return;

        if (savingRef.current) return;
        savingRef.current = true;

        const toastId = toast.loading('Guardando intención...');
        try {
            const res = await updateIntentionNodeConfig({
                nodeId: node.id,
                intentionPrompt: trimmed,
                intentionMaxAttempts: maxAttempts,
            });

            if (!res?.success) {
                toast.error(res?.message ?? 'No se pudo guardar', { id: toastId });
                return;
            }

            lastSavedRef.current = payload;
            toast.success('Intención guardada', { id: toastId });
            router.refresh();
        } catch (e: any) {
            toast.error(e?.message ?? 'Error guardando intención', { id: toastId });
        } finally {
            savingRef.current = false;
        }
    };

    const onBlurSave = () => {
        // evita onBlur si el valor es inválido
        if (maxAttempts < 1 || maxAttempts > 10) return;
        save();
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs">Prompt del nodo</Label>
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onBlur={onBlurSave}
                    placeholder="Ej: Solicita nombre y descripción del servicio."
                    className="min-h-[90px]"
                />
                <p className="text-[11px] text-muted-foreground">
                    Este texto se enviará al usuario mientras el nodo esté “esperando” respuesta.
                </p>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">Cantidad máxima de intentos</Label>
                <Input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    onBlur={onBlurSave}
                    className="h-9"
                />
                <p className="text-[11px] text-muted-foreground">
                    Si el usuario no cumple en estos intentos, se irá por la rama <b>No</b>.
                </p>
            </div>
        </div>
    );
}