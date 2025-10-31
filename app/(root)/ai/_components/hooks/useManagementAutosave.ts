"use client";

import { useEffect, useMemo, useRef } from "react";
import { patchManagementSection } from "@/actions/system-prompt-actions";

type UseManagementAutosaveOpts = {
    promptId: string;
    version: number;
    text: string; // markdown plano (guardado en policiesMd)
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: any) => void;
    debounceMs?: number;
};

export function useManagementAutosave({
    promptId,
    version,
    text,
    onVersionChange,
    onConflict,
    debounceMs = 700,
}: UseManagementAutosaveOpts) {
    const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const payload = useMemo(
        () => ({
            version,
            data: {
                // si tu editor guarda texto libre, usaré policiesMd como campo
                // (ajusta a 'markdown' si así definiste tu schema)
                policiesMd: text,
            },
        }),
        [text, version]
    );

    useEffect(() => {
        if (tRef.current) clearTimeout(tRef.current);
        tRef.current = setTimeout(async () => {
            try {
                const res = await patchManagementSection({
                    promptId,
                    version: payload.version,
                    data: payload.data,
                });

                // res: { ok: true, data } | { ok: false, conflict: true, data }
                if (!res.ok && res.conflict) {
                    onConflict?.(res.data);
                    // la versión está en res.data.version
                    if (typeof (res.data as any)?.version === "number") {
                        onVersionChange((res.data as any).version);
                    }
                } else if (res.ok) {
                    // versión nueva en res.data.version
                    if (typeof (res.data as any)?.version === "number") {
                        onVersionChange((res.data as any).version);
                    }
                }
            } catch {
                // opcional: toast de error
            }
        }, debounceMs);

        return () => {
            if (tRef.current) clearTimeout(tRef.current);
        };
    }, [promptId, payload, onConflict, onVersionChange, debounceMs]);
}
