// app/(root)/ai/_components/hooks/usePromptActions.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { savePrompt, publishPrompt, revertToRevision } from "@/actions/system-prompt-actions";
import { toast } from "sonner";

type ConflictPayload = any;

export function usePromptActions(opts: {
    promptId: string;
    version: number;
    publishedBy?: string;
    onVersionChange: (next: number) => void;
    onConflict?: (serverState: ConflictPayload) => void;
    revalidatePath?: string;
}) {
    const { promptId, version, publishedBy, onVersionChange, onConflict, revalidatePath } = opts;

    const [loading, setLoading] = useState<null | "saving" | "publishing" | "reverting">(null);
    const [error, setError] = useState<string | null>(null);

    // 👇 mantener la versión viva en un ref
    const versionRef = useRef(version);
    useEffect(() => {
        versionRef.current = version;
    }, [version]);

    const handleConflict = useCallback((serverState: any) => {
        onConflict?.(serverState);
        // toast.info(
        //     "Este prompt se actualizó en otra pestaña o usuario. Cargamos la última versión del servidor."
        // );
        // setError("Conflicto de versión: se detectaron cambios en el servidor.");
    }, [onConflict]);

    const handleOk = useCallback((nextVersion?: number) => {
        if (typeof nextVersion === "number") onVersionChange(nextVersion);
        setError(null);
    }, [onVersionChange]);

    const publish = useCallback(async (note?: string) => {
        if (!promptId || !publishedBy) return;
        setLoading("publishing"); setError(null);
        try {
            const res = await publishPrompt({
                promptId,
                version: versionRef.current,    // 👈 aquí también
                publishedBy,
                note,
                revalidate: revalidatePath,
            });

            if ("conflict" in res && res.conflict) {
                handleConflict(res.data);
                return;
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
    }, [promptId, publishedBy, revalidatePath, handleConflict, handleOk]);

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
        loading,
        error,
        // save,
        publish,
        revert,
    };
}