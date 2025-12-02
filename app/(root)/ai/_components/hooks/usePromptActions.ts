// app/(root)/ai/_components/hooks/usePromptActions.ts
"use client";

import { useCallback, useState } from "react";
import { savePrompt, publishPrompt, revertToRevision } from "@/actions/system-prompt-actions";
import { toast } from "sonner";

type ConflictPayload = any;

export function usePromptActions(opts: {
    promptId: string;
    version: number;                        // versión local actual
    publishedBy?: string;                   // user.id (cuid)
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: ConflictPayload) => void; // rehidratar UI si hay conflicto
    revalidatePath?: string;                // opcional
}) {
    const { promptId, version, publishedBy, onVersionChange, onConflict, revalidatePath } = opts;

    const [loading, setLoading] = useState<null | "saving" | "publishing" | "reverting">(null);
    const [error, setError] = useState<string | null>(null);

    const handleConflict = useCallback((serverState: any) => {
        // 1) Rehidratar la UI con lo que diga el servidor
        onConflict?.(serverState);

        // 2) Avisar al usuario que recargamos con la última versión
        // toast.warning(
        //     "Se detectaron cambios en otra ventana o sesión. Actualizamos el contenido con la última versión del servidor. Revisa los cambios y vuelve a guardar."
        // );

        // 3) No tratamos esto como 'error' persistente debajo del botón
        //    (si quisieras mostrar un textito pequeño, podrías poner otro mensaje aquí)
        setError(null);
    }, [onConflict]);


    const handleOk = useCallback((nextVersion?: number) => {
        if (typeof nextVersion === "number") onVersionChange(nextVersion);
        setError(null);
    }, [onVersionChange]);

    const save = useCallback(async () => {
        if (!promptId) return;
        setLoading("saving"); setError(null);
        try {
            const res = await savePrompt({ promptId, version, revalidate: revalidatePath });
            if ('conflict' in res && res.conflict) return handleConflict(res.data);
            if (!res.ok) return setError("No se pudo guardar.");
            handleOk(res.data?.version);
        } catch (e: any) {
            setError(e?.message ?? "Error al guardar.");
        } finally {
            setLoading(null);
        }
    }, [promptId, version, revalidatePath, handleConflict, handleOk]);

    const publish = useCallback(async (note?: string) => {
        if (!promptId || !publishedBy) return;
        setLoading("publishing"); setError(null);
        try {
            const res = await publishPrompt({
                promptId,
                version,
                publishedBy,
                note,
                revalidate: revalidatePath,
            });

            // ✅ Narrowing correcto
            if ('conflict' in res && res.conflict) {
                return handleConflict(res.data);
            }
            if (!res.ok) {
                return setError("No se pudo publicar.");
            }

            handleOk(res.data?.prompt?.version);
        } catch (e: any) {
            setError(e?.message ?? "Error al publicar.");
        } finally {
            setLoading(null);
        }
    }, [promptId, version, publishedBy, revalidatePath, handleConflict, handleOk]);


    const revert = useCallback(async (revisionNumber: number) => {
        if (!promptId) return;
        setLoading("reverting"); setError(null);
        try {
            const res = await revertToRevision({
                promptId,
                revisionNumber,
                revalidate: revalidatePath,
            });
            if (!res?.ok) return setError(res?.error ?? "No se pudo revertir.");
            handleOk(res.data?.version);
            // Nota: al revertir no hay “conflict”; tras revertir debes re-hidratar `sections` (tu onConflict puede manejarlo si quieres reutilizarlo)
            onConflict?.({ sections: res.data?.sections, version: res.data?.version });
        } catch (e: any) {
            setError(e?.message ?? "Error al revertir.");
        } finally {
            setLoading(null);
        }
    }, [promptId, revalidatePath, onConflict, handleOk]);

    return {
        loading, error,
        save, publish, revert,
    };
}
