'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { WorkflowNodeDB } from '@/types/workflow-node';
import { updateIntentionNodeConfig } from '@/actions/workflow-node-action';

type Props = {
    node: WorkflowNodeDB;
};

export function EmbeddingNode({ node }: Props) {
    const router = useRouter();
    const [miniPrompt, setMiniPrompt] = useState(node.miniPrompt ?? '');
    const [threshold, setThreshold] = useState<number>(node.threshold ?? 0.5);
    const [noMatchMessage, setNoMatchMessage] = useState(node.noMatchMessage ?? '');

    useEffect(() => {
        setMiniPrompt(node.miniPrompt ?? '');
        setThreshold(node.threshold ?? 0.5);
        setNoMatchMessage(node.noMatchMessage ?? '');
    }, [node.miniPrompt, node.threshold, node.noMatchMessage]);

    const save = async () => {
        const toastId = toast.loading('Guardando configuración de intención...');
        try {
            const res = await updateIntentionNodeConfig({
                nodeId: node.id,
                miniPrompt: miniPrompt.trim(),
                threshold,
                noMatchMessage: noMatchMessage.trim(),
            });

            if (!res?.success) {
                toast.error(res?.message ?? 'No se pudo guardar', { id: toastId });
                return;
            }

            toast.success('Intención guardada', { id: toastId });
            router.refresh();
        } catch (e: any) {
            toast.error(e?.message ?? 'Error guardando intención', { id: toastId });
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs">mini prompt</Label>
                <Textarea
                    value={miniPrompt}
                    onChange={(e) => setMiniPrompt(e.target.value)}
                    placeholder="Ej: Si el usuario pide info del curso, muestra horarios y precio."
                    className="min-h-[90px]"
                />
                <p className="text-[11px] text-muted-foreground">
                    Recomendación: máximo 1–2 frases (280 caracteres).
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Umbral</Label>
                    <span className="text-xs text-muted-foreground">{threshold.toFixed(2)}</span>
                </div>

                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full"
                />

                <p className="text-[11px] text-muted-foreground">
                    Más alto = más estricto. Más bajo = se activa más fácil.
                </p>
            </div>

            <Button type="button" className="w-full" onClick={save}>
                Guardar configuración
            </Button>
        </div>
    );
}