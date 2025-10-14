// useBusinessAutosave.ts
'use client';

import { patchBusinessSection } from '@/actions/system-prompt-actions';
import { FormValues } from '@/types/agentAi';
import { useEffect, useMemo, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';

function debounce<F extends (...args: any[]) => any>(fn: F, ms = 700) {
    let t: any;
    return (...args: Parameters<F>) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

export function useBusinessAutosave(opts: {
    form: UseFormReturn<FormValues>;
    promptId: string;
    version: number;
    onVersionChange: (nextVersion: number) => void;
    onConflict?: (serverState: any) => void;
}) {
    const { form, promptId, version, onVersionChange, onConflict } = opts;
    const versionRef = useRef(version);

    useEffect(() => { versionRef.current = version; }, [version]);

    const watched = form.watch();

    const runSave = useMemo(
        () =>
            debounce(async (data: FormValues) => {
                try {
                    // ⬇️ DTO sin undefined
                    const dto = {
                        nombre: data.nombre ?? "",
                        sector: data.sector ?? "",
                        ubicacion: data.ubicacion ?? "",
                        horarios: data.horarios ?? "",
                        maps: data.maps ?? "",
                        telefono: data.telefono ?? "",
                        email: data.email ?? "",
                        sitio: data.sitio ?? "",
                        facebook: data.facebook ?? "",
                        instagram: data.instagram ?? "",
                        tiktok: data.tiktok ?? "",
                        youtube: data.youtube ?? "",
                        notas: data.notas ?? "",
                    };

                    const res = await patchBusinessSection({
                        promptId,
                        version: versionRef.current,
                        data: dto, // ← ya “string” todo
                    });

                    if (res?.conflict) {
                        onConflict?.(res.data);
                        return;
                    }
                    if (res?.ok && res?.data?.version) {
                        onVersionChange(res.data.version);
                    }
                } catch { }
            }, 700),
        [promptId, onConflict, onVersionChange]
    );

    useEffect(() => {
        if (!watched?.nombre || !watched.nombre.trim()) return;
        runSave(watched as FormValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(watched)]);
}