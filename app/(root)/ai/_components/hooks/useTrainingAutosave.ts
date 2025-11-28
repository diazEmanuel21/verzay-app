// app/(root)/ai/_components/hooks/useTrainingAutosave.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchTrainingSection } from "@/actions/system-prompt-actions";
import { StepTraining } from "@/types/agentAi";
import { toast } from "sonner";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

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
    onStatusChange?: (status: AutosaveStatus) => void; // 👈 NUEVO
}) {
    const { promptId, version, steps, onVersionChange, onConflict, onStatusChange } = opts;

    const versionRef = useRef(version);
    useEffect(() => {
        versionRef.current = version;
    }, [version]);

    // onConflict estable vía ref (para no ser dep de runSave)
    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => {
        conflictRef.current = onConflict;
    }, [onConflict]);

    // Evita autosave inicial tras hidratar desde BD (aunque realmente el hash ya te protege bastante)
    const mountedRef = useRef(false);
    useEffect(() => {
        mountedRef.current = true;
    }, []);

    // Hash para evitar saves redundantes
    const lastHashRef = useRef<string>("");
    const stepsHash = useMemo(() => JSON.stringify(steps), [steps]);

    const notifyStatus = (status: AutosaveStatus) => {
        onStatusChange?.(status);
    };

    const runSave = useMemo(() => {
        const fn = async (payload: { steps: StepTraining[] }) => {
            if (!promptId) return;
            if (!mountedRef.current) return; // seguridad extra

            notifyStatus("saving");

            try {
                const res = await patchTrainingSection({
                    promptId,
                    version: versionRef.current,
                    data: { steps: payload.steps },
                });

                if (res?.conflict) {
                    notifyStatus("error");
                    toast.error(
                        "Este entrenamiento se actualizó en otro lugar. Vamos a cargar la última versión."
                    );
                    conflictRef.current?.(res.data);
                    return;
                }

                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                    notifyStatus("saved");
                } else {
                    notifyStatus("error");
                    toast.error("No se pudo guardar los cambios de entrenamiento.");
                }
            } catch (err) {
                console.error("[useTrainingAutosave] Error al guardar:", err);
                notifyStatus("error");
                toast.error("Error al guardar el entrenamiento automáticamente.");
            }
        };
        return createDebounced(fn, 700);
        // se recrea solo si cambian estas referencias clave
    }, [promptId, onVersionChange, onStatusChange]);

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