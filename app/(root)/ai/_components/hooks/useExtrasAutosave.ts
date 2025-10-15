// app/(root)/ai/_components/hooks/useExtrasAutosave.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchExtrasSection } from "@/actions/system-prompt-actions";

export type ExtraItemDTO = { id: string; title?: string; content?: string };

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
    items: ExtraItemDTO[];
    firmaEnabled: boolean;
    firmaText: string;
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
}) {
    const { promptId, version, items, firmaEnabled, firmaText, onVersionChange, onConflict } = opts;

    const versionRef = useRef(version);
    useEffect(() => { versionRef.current = version; }, [version]);

    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => { conflictRef.current = onConflict; }, [onConflict]);

    const mountedRef = useRef(false);
    useEffect(() => { mountedRef.current = true; }, []);

    const payloadHash = useMemo(
        () => JSON.stringify({ items, firmaEnabled, firmaText }),
        [items, firmaEnabled, firmaText]
    );
    const lastHashRef = useRef<string>("");

    const runSave = useMemo(() => {
        const fn = async (payload: { items: ExtraItemDTO[]; firmaEnabled: boolean; firmaText: string }) => {
            if (!promptId) return;
            if (!mountedRef.current) return;

            try {
                const res = await patchExtrasSection({
                    promptId,
                    version: versionRef.current,
                    data: payload, // { items, firmaEnabled, firmaText }
                });

                if (res?.conflict) {
                    conflictRef.current?.(res.data);
                    return;
                }
                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                }
            } catch { }
        };
        return createDebounced(fn, 700);
    }, [promptId, onVersionChange]);

    useEffect(() => {
        if (!promptId) return;
        if (lastHashRef.current === payloadHash) return;
        lastHashRef.current = payloadHash;

        runSave({ items, firmaEnabled, firmaText });
        return () => runSave.cancel?.();
    }, [payloadHash, promptId, runSave, items, firmaEnabled, firmaText]);
}