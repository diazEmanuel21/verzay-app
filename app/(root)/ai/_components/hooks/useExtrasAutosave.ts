"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchExtrasSection } from "@/actions/system-prompt-actions";
import { ExtraItemType } from "@/types/agentAi";

function createDebounced<F extends (...args: any[]) => any>(fn: F, ms = 700) {
    let t: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<F>) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
    (debounced as any).cancel = () => { if (t) clearTimeout(t); t = null; };
    return debounced as F & { cancel: () => void };
}

export function useExtrasAutosave(opts: {
    promptId: string;
    version: number;
    items: ExtraItemType[];
    firmaEnabled: boolean;
    firmaText: string;
    firmaName: string;
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
}) {
    const { promptId, version, items, firmaEnabled, firmaText, firmaName, onVersionChange, onConflict } = opts;

    const versionRef = useRef(version);
    useEffect(() => { versionRef.current = version; }, [version]);

    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => { conflictRef.current = onConflict; }, [onConflict]);

    const mountedRef = useRef(false);
    useEffect(() => { mountedRef.current = true; }, []);

    // Hash alineado a lo que realmente se envía (steps + firma*)
    const payloadHash = useMemo(
        () => JSON.stringify({ steps: items, firmaEnabled, firmaText, firmaName }),
        [items, firmaEnabled, firmaText, firmaName]
    );
    const lastHashRef = useRef<string>("");

    const runSave = useMemo(() => {
        const fn = async (payload: {
            steps: ExtraItemType[];
            firmaEnabled: boolean;
            firmaText: string;
            firmaName: string;
        }) => {
            if (!promptId) return;
            if (!mountedRef.current) return;

            try {
                const res = await patchExtrasSection({
                    promptId,
                    version: versionRef.current,
                    data: {
                        steps: payload.steps,
                        firmaEnabled: payload.firmaEnabled,
                        firmaText: payload.firmaText,
                        firmaName: payload.firmaName,
                    },
                });

                if (res?.conflict) {
                    conflictRef.current?.(res.data);
                    return;
                }
                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                }
            } catch (err) {
                console.error("patchExtrasSection error", err);
            }
        };
        return createDebounced(fn, 700);
    }, [promptId, onVersionChange]);

    useEffect(() => {
        if (!promptId) return;
        if (lastHashRef.current === payloadHash) return;
        lastHashRef.current = payloadHash;

        runSave({ steps: items, firmaEnabled, firmaText, firmaName });
        return () => runSave.cancel?.();
    }, [payloadHash, promptId, runSave, items, firmaEnabled, firmaText, firmaName]);
}