// app/(root)/ai/_components/hooks/useManagementAutosave.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchManagementSection } from "@/actions/system-prompt-actions";
import type { ManagementItem } from "@/types/agentAi";
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

export function useManagementAutosave(opts: {
    promptId: string;
    version: number;
    steps: ManagementItem[];
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
    onStatusChange?: (status: AutosaveStatus) => void; // 👈 NUEVO
}) {
    const { promptId, version, steps, onVersionChange, onConflict, onStatusChange } = opts;

    const versionRef = useRef(version);
    useEffect(() => { versionRef.current = version; }, [version]);

    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => { conflictRef.current = onConflict; }, [onConflict]);

    const mountedRef = useRef(false);
    useEffect(() => { mountedRef.current = true; }, []);

    const stepsHash = useMemo(() => JSON.stringify(steps), [steps]);
    const lastHashRef = useRef<string>("");

    const notifyStatus = (status: AutosaveStatus) => {
        onStatusChange?.(status);
    };

    const runSave = useMemo(() => {
        const fn = async (payload: { steps: ManagementItem[] }) => {
            if (!promptId) return;
            if (!mountedRef.current) return;

            notifyStatus("saving");

            try {
                const res = await patchManagementSection({
                    promptId,
                    version: versionRef.current,
                    data: { steps: payload.steps }, // 👈 ManagementDraftSchema.steps
                });

                if (res?.conflict) {
                    notifyStatus("error");
                    toast.error(
                        "La sección de gestión se actualizó en otro lugar. Se cargará la última versión."
                    );
                    conflictRef.current?.(res.data);
                    return;
                }

                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                    notifyStatus("saved");
                } else {
                    notifyStatus("error");
                    toast.error("No se pudo guardar los cambios de gestión.");
                }
            } catch (err) {
                console.error("patchManagementSection error", err);
                notifyStatus("error");
                toast.error("Error al guardar automáticamente la sección de gestión.");
            }
        };
        return createDebounced(fn, 700);
    }, [promptId, onVersionChange, onStatusChange]);

    useEffect(() => {
        if (!promptId) return;
        if (lastHashRef.current === stepsHash) return;

        lastHashRef.current = stepsHash;
        runSave({ steps });

        return () => runSave.cancel?.();
    }, [stepsHash, promptId, runSave, steps]);
}