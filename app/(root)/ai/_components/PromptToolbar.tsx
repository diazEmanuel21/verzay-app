// app/(root)/ai/_components/PromptToolbar.tsx
"use client";

import { useEffect, useCallback, useTransition } from "react"; // 👈 useTransition
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePromptActions } from "./hooks/usePromptActions";

export function PromptToolbar(props: {
    promptId: string;
    version: number;
    userId: string;
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
    revalidatePath?: string;
    revisions?: Array<{ revisionNumber: number; label?: string }>;
}) {
    const { promptId, version, userId, onVersionChange, onConflict, revalidatePath } = props;

    const router = useRouter();

    const { loading, error, publish } = usePromptActions({
        promptId,
        version,
        publishedBy: userId,
        onVersionChange,
        onConflict,
        revalidatePath,
    });

    // 👇 trackeamos el estado del router.refresh()
    const [isPending, startTransition] = useTransition();

    // loading => guardando en servidor
    // isPending => refrescando la UI (router.refresh)
    const isSaving = !!loading || isPending;

    const handlePublish = useCallback(async () => {
        try {
            await publish();

            // Lanzamos el refresh dentro de un transition, así isPending refleja el progreso
            startTransition(() => {
                router.refresh();
            });

            toast.success("Guardado correctamente");
        } catch (e: any) {
            toast.error(e?.message ?? "No se pudo guardar");
        }
    }, [publish, router, startTransition]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    return (
        <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isSaving ? "Guardando…" : "Listo para guardar"}
            </div>

            <TooltipProvider>
                <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={handlePublish}
                            disabled={isSaving}
                            aria-busy={isSaving}
                            aria-label="Guardar"
                            className="
                gap-0 sm:gap-2 px-2 sm:px-3 h-9
                bg-emerald-600 text-white
                hover:bg-emerald-700
                focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                disabled:bg-emerald-600/60 disabled:text-white/80
              "
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="hidden sm:inline">Guardando…</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="h-4 w-4" />
                                    <span className="hidden sm:inline">Guardar</span>
                                </>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Guardar</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {error && <span className="text-xs text-destructive">{error}</span>}
        </>
    );
}