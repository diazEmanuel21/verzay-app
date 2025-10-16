"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchProductsSection } from "@/actions/system-prompt-actions";
import { ProductItemDTO } from "@/types/agentAi";

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

export function useProductsAutosave(opts: {
    promptId: string;
    version: number;
    items: ProductItemDTO[];
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
}) {
    const { promptId, version, items, onVersionChange, onConflict } = opts;

    const versionRef = useRef(version);
    useEffect(() => { versionRef.current = version; }, [version]);

    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => { conflictRef.current = onConflict; }, [onConflict]);

    const mountedRef = useRef(false);
    useEffect(() => { mountedRef.current = true; }, []);

    const itemsHash = useMemo(() => JSON.stringify(items), [items]);
    const lastHashRef = useRef<string>("");

    const runSave = useMemo(() => {
        const fn = async (payload: { items: ProductItemDTO[] }) => {
            if (!promptId) return;
            if (!mountedRef.current) return;

            try {
                const res = await patchProductsSection({
                    promptId,
                    version: versionRef.current,
                    data: { items: payload.items },
                });

                if (res?.conflict) {
                    conflictRef.current?.(res.data);
                    return;
                }
                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                }
            } catch {/* opcional: toast/log */ }
        };
        return createDebounced(fn, 700);
    }, [promptId, onVersionChange]);

    useEffect(() => {
        if (!promptId) return;
        if (lastHashRef.current === itemsHash) return;

        lastHashRef.current = itemsHash;
        runSave({ items });

        return () => runSave.cancel?.();
    }, [itemsHash, promptId, runSave, items]);
}