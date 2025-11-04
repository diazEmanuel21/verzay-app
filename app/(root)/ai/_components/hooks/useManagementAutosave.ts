"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchManagementSection } from "@/actions/system-prompt-actions";
import type { ElementItem, ManagementItem } from "@/types/agentAi";

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
}) {
    const { promptId, version, steps, onVersionChange, onConflict } = opts;

    const versionRef = useRef(version);
    useEffect(() => { versionRef.current = version; }, [version]);

    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => { conflictRef.current = onConflict; }, [onConflict]);

    const mountedRef = useRef(false);
    useEffect(() => { mountedRef.current = true; }, []);

    const stepsHash = useMemo(() => JSON.stringify(steps), [steps]);
    const lastHashRef = useRef<string>("");

    const runSave = useMemo(() => {
        const fn = async (payload: { steps: ManagementItem[] }) => {
            if (!promptId) return;
            if (!mountedRef.current) return;
            try {
                const res = await patchManagementSection({
                    promptId,
                    version: versionRef.current,
                    data: { steps: payload.steps }, // 👈 ManagementDraftSchema.steps
                });

                if (res?.conflict) {
                    conflictRef.current?.(res.data);
                    return;
                }
                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                }
            } catch { /* opcional: toast/log */ }
        };
        return createDebounced(fn, 700);
    }, [promptId, onVersionChange]);

    useEffect(() => {
        if (!promptId) return;
        if (lastHashRef.current === stepsHash) return;

        lastHashRef.current = stepsHash;
        runSave({ steps });

        return () => runSave.cancel?.();
    }, [stepsHash, promptId, runSave, steps]);
}