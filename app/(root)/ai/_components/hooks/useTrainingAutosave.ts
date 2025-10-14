// app/(root)/ai/_components/hooks/useTrainingAutosave.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchTrainingSection } from "@/actions/system-prompt-actions";
import { StepTraining } from "@/types/agentAi";

function createDebounced<F extends (...args: any[]) => any>(fn: F, ms = 700) {
    let t: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<F>) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
    (debounced as any).cancel = () => {
        if (t) clearTimeout(t);
        t = null;
    };
    return debounced as F & { cancel: () => void };
}

export function useTrainingAutosave(opts: {
    promptId: string;
    version: number;
    steps: StepTraining[];
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
}) {
    const { promptId, version, steps, onVersionChange, onConflict } = opts;

    const versionRef = useRef(version);
    useEffect(() => { versionRef.current = version; }, [version]);

    // onConflict estable vía ref (para no ser dep de runSave)
    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => { conflictRef.current = onConflict; }, [onConflict]);

    // Evita autosave inicial tras hidratar desde BD
    const mountedRef = useRef(false);
    useEffect(() => { mountedRef.current = true; }, []);

    // Hash para evitar saves redundantes
    const lastHashRef = useRef<string>("");
    const stepsHash = useMemo(() => JSON.stringify(steps), [steps]);

    const runSave = useMemo(() => {
        const fn = async (payload: { steps: StepTraining[] }) => {
            if (!promptId) return;
            // Evitar primer disparo por hidratación
            if (!mountedRef.current) return;

            try {
                const res = await patchTrainingSection({
                    promptId,
                    version: versionRef.current,
                    data: { steps: payload.steps },
                });

                if (res?.conflict) {
                    conflictRef.current?.(res.data);
                    return;
                }
                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                }
            } catch {
                // opcional: logger/toast
            }
        };
        return createDebounced(fn, 700);
        // solo cambia si cambia promptId o onVersionChange
    }, [promptId, onVersionChange]);

    useEffect(() => {
        if (!promptId) return;

        // No re-guardar si el contenido no cambió
        if (lastHashRef.current === stepsHash) return;
        lastHashRef.current = stepsHash;

        runSave({ steps });

        // cleanup: cancelar debounce en unmount o cambio de hash antes de disparar
        return () => {
            runSave.cancel?.();
        };
    }, [stepsHash, promptId, runSave, steps]);
}
