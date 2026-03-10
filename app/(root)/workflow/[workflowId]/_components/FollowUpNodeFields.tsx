'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { updateFollowUpNodeConfig } from '@/actions/workflow-node-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { WorkflowNodeDB } from '@/types/workflow-node';

type Props = {
  node: WorkflowNodeDB;
};

type FollowUpMode = 'static' | 'ai';

export const FollowUpNodeFields = ({ node }: Props) => {
  const router = useRouter();

  const [mode, setMode] = useState<FollowUpMode>(
    node.followUpMode === 'ai' ? 'ai' : 'static'
  );
  const [goal, setGoal] = useState(node.followUpGoal ?? '');
  const [prompt, setPrompt] = useState(node.followUpPrompt ?? '');
  const [maxAttempts, setMaxAttempts] = useState(node.followUpMaxAttempts ?? 3);
  const [cancelOnReply, setCancelOnReply] = useState(
    node.followUpCancelOnReply ?? true
  );

  useEffect(() => {
    setMode(node.followUpMode === 'ai' ? 'ai' : 'static');
    setGoal(node.followUpGoal ?? '');
    setPrompt(node.followUpPrompt ?? '');
    setMaxAttempts(node.followUpMaxAttempts ?? 3);
    setCancelOnReply(node.followUpCancelOnReply ?? true);
  }, [
    node.followUpMode,
    node.followUpGoal,
    node.followUpPrompt,
    node.followUpMaxAttempts,
    node.followUpCancelOnReply,
  ]);

  const savingRef = useRef(false);
  const lastSavedRef = useRef({
    mode: node.followUpMode === 'ai' ? 'ai' : 'static',
    goal: (node.followUpGoal ?? '').trim(),
    prompt: (node.followUpPrompt ?? '').trim(),
    maxAttempts: node.followUpMaxAttempts ?? 3,
    cancelOnReply: node.followUpCancelOnReply ?? true,
  });

  const save = async (
    overrides: Partial<{
      mode: FollowUpMode;
      goal: string;
      prompt: string;
      maxAttempts: number;
      cancelOnReply: boolean;
    }> = {}
  ) => {
    const payload = {
      mode: overrides.mode ?? mode,
      goal: (overrides.goal ?? goal).trim(),
      prompt: (overrides.prompt ?? prompt).trim(),
      maxAttempts: overrides.maxAttempts ?? maxAttempts,
      cancelOnReply: overrides.cancelOnReply ?? cancelOnReply,
    };

    if (
      lastSavedRef.current.mode === payload.mode &&
      lastSavedRef.current.goal === payload.goal &&
      lastSavedRef.current.prompt === payload.prompt &&
      lastSavedRef.current.maxAttempts === payload.maxAttempts &&
      lastSavedRef.current.cancelOnReply === payload.cancelOnReply
    ) {
      return;
    }

    if (savingRef.current) return;
    savingRef.current = true;

    const toastId = toast.loading('Guardando follow-up...');
    try {
      const res = await updateFollowUpNodeConfig({
        nodeId: node.id,
        followUpMode: payload.mode,
        followUpGoal: payload.goal,
        followUpPrompt: payload.prompt,
        followUpMaxAttempts: payload.maxAttempts,
        followUpCancelOnReply: payload.cancelOnReply,
      });

      if (!res?.success) {
        toast.error(res?.message ?? 'No se pudo guardar el follow-up', { id: toastId });
        return;
      }

      lastSavedRef.current = payload;
      toast.success('Follow-up guardado', { id: toastId });
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Error guardando follow-up', { id: toastId });
    } finally {
      savingRef.current = false;
    }
  };

  const onBlurSave = () => {
    if (maxAttempts < 1 || maxAttempts > 10) return;
    void save();
  };

  const handleModeChange = (checked: boolean) => {
    const nextMode: FollowUpMode = checked ? 'ai' : 'static';
    setMode(nextMode);
    void save({ mode: nextMode });
  };

  const handleCancelOnReplyChange = (checked: boolean) => {
    setCancelOnReply(checked);
    void save({ cancelOnReply: checked });
  };

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/30 p-3 nodrag">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Modo del follow-up</Label>
          <p className="text-[11px] text-muted-foreground">
            El modo estático usa el mensaje del nodo. El modo IA genera el texto al momento de ejecutar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`follow-up-mode-${node.id}`} className="text-xs">
            IA
          </Label>
          <Switch
            id={`follow-up-mode-${node.id}`}
            checked={mode === 'ai'}
            onCheckedChange={handleModeChange}
          />
        </div>
      </div>

      {mode === 'ai' ? (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Objetivo del follow-up</Label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={onBlurSave}
              placeholder="Ej: retomar la conversación, detectar interés real y proponer el siguiente paso comercial."
              className="min-h-[90px]"
            />
            <p className="text-[11px] text-muted-foreground">
              Resume qué debe lograr la IA con este seguimiento.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Prompt interno</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={onBlurSave}
              placeholder="Ej: escribe breve, no repitas el mensaje anterior, usa el contexto del CRM y termina con una pregunta concreta."
              className="min-h-[120px]"
            />
            <p className="text-[11px] text-muted-foreground">
              Instrucciones internas para la generación. No se muestran al lead.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Máximo de intentos IA</Label>
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
              Controla cuántas veces se puede volver a generar este seguimiento.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div className="space-y-1">
              <Label htmlFor={`follow-up-cancel-${node.id}`} className="text-xs font-semibold">
                Cancelar si responde
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Corta los reintentos IA si el lead vuelve a escribir antes del próximo envío.
              </p>
            </div>
            <Switch
              id={`follow-up-cancel-${node.id}`}
              checked={cancelOnReply}
              onCheckedChange={handleCancelOnReplyChange}
            />
          </div>
        </>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          En modo estático se seguirá usando el contenido del nodo como mensaje programado.
        </p>
      )}
    </div>
  );
};
