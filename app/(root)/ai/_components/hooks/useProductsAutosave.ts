// app/(root)/ai/_components/hooks/useProductsAutosave.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchProductsSection } from "@/actions/system-prompt-actions";
import { ProductItemType } from "@/types/agentAi";
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

export function useProductsAutosave(opts: {
    promptId: string;
    version: number;
    items: ProductItemType[];
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
    onStatusChange?: (status: AutosaveStatus) => void; // 👈 NUEVO
}) {
    const { promptId, version, items, onVersionChange, onConflict, onStatusChange } = opts;

    const versionRef = useRef(version);
    useEffect(() => {
        versionRef.current = version;
    }, [version]);

    const conflictRef = useRef<typeof onConflict>();
    useEffect(() => {
        conflictRef.current = onConflict;
    }, [onConflict]);

    const mountedRef = useRef(false);
    useEffect(() => {
        mountedRef.current = true;
    }, []);

    const itemsHash = useMemo(() => JSON.stringify(items), [items]);
    const lastHashRef = useRef<string>("");

    const notifyStatus = (status: AutosaveStatus) => {
        onStatusChange?.(status);
    };

    const runSave = useMemo(() => {
        const fn = async (payload: { items: ProductItemType[] }) => {
            if (!promptId) return;
            if (!mountedRef.current) return;

            notifyStatus("saving");

            try {
                const res = await patchProductsSection({
                    promptId,
                    version: versionRef.current,
                    data: { steps: payload.items }, // se mantiene igual
                });

                if (res?.conflict) {
                    notifyStatus("error");
                    toast.error(
                        "Los productos se actualizaron en otro lugar. Se cargará la última versión."
                    );
                    conflictRef.current?.(res.data);
                    return;
                }

                if (res?.ok && res?.data?.version) {
                    onVersionChange(res.data.version);
                    notifyStatus("saved");
                } else {
                    notifyStatus("error");
                    toast.error("No se pudo guardar los cambios de productos.");
                }
            } catch (err) {
                console.error("[useProductsAutosave] Error al guardar:", err);
                notifyStatus("error");
                toast.error("Error al guardar automáticamente los productos.");
            }
        };
        return createDebounced(fn, 700);
    }, [promptId, onVersionChange, onStatusChange]);

    useEffect(() => {
        if (!promptId) return;
        if (lastHashRef.current === itemsHash) return;

        lastHashRef.current = itemsHash;
        runSave({ items });

        return () => runSave.cancel?.();
    }, [itemsHash, promptId, runSave, items]);
}
