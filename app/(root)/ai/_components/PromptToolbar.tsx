"use client";

import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
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

    const { loading, error, publish } = usePromptActions({
        promptId,
        version,
        publishedBy: userId,
        onVersionChange,
        onConflict,
        revalidatePath,
    });

    return (
        <div className="flex items-center gap-2 w-full justify-end">
            <Button onClick={() => publish()} disabled={loading !== null} className="gap-2">
                <UploadCloud className="h-4 w-4" />
                Guardar
            </Button>
            {loading && <span className="text-xs text-muted-foreground">Procesando…</span>}
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    );
}
