// useBusinessAutosave.ts
"use client";

import { patchBusinessSection } from "@/actions/system-prompt-actions";
import { FormValues } from "@/types/agentAi";
import { useEffect, useMemo, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

function debounce<F extends (...args: any[]) => void>(fn: F, ms = 700) {
    let t: ReturnType<typeof setTimeout> | undefined;

    return (...args: Parameters<F>) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

export function useBusinessAutosave(opts: {
    form: UseFormReturn<FormValues>;
    promptId: string;
    version: number;
    onVersionChange: (nextVersion: number) => void;
    onConflict?: (serverState: any) => void;
    onStatusChange?: (status: AutosaveStatus) => void; // 👈 NUEVO
}) {
    const { form, promptId, version, onVersionChange, onConflict, onStatusChange } = opts;

    const versionRef = useRef(version);
    useEffect(() => {
        versionRef.current = version;
    }, [version]);

    const watched = form.watch();

    const notifyStatus = (status: AutosaveStatus) => {
        onStatusChange?.(status);
    };

    const runSave = useMemo(
        () =>
            debounce(async (data: FormValues) => {
                // Si no hay nombre, no guardamos (como ya tenías)
                if (!data?.nombre || !data.nombre.trim()) return;

                notifyStatus("saving");

                try {
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
                        data: dto,
                    });

                    if (res?.conflict) {
                        notifyStatus("error");
                        toast.error(
                            "Este bloque se actualizó en otro lugar. Vamos a cargar la última versión."
                        );
                        onConflict?.(res.data);
                        return;
                    }

                    if (res?.ok && res?.data?.version) {
                        onVersionChange(res.data.version);
                        notifyStatus("saved");
                    } else {
                        notifyStatus("error");
                        toast.error("No se pudo guardar los cambios.");
                    }
                } catch (err) {
                    console.error("[useBusinessAutosave] Error al guardar:", err);
                    notifyStatus("error");
                    toast.error("Error al guardar automáticamente los cambios.");
                }
            }, 700),
        [promptId, onConflict, onVersionChange]
    );

    useEffect(() => {
        // ya no validamos aquí el nombre; se valida dentro de runSave
        runSave(watched as FormValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(watched)]);
}