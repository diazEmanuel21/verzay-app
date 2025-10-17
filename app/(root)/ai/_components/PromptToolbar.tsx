// app/(root)/ai/_components/PromptToolbar.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, UploadCloud, RotateCcw } from "lucide-react";
import { usePromptActions } from "./hooks/usePromptActions";

export function PromptToolbar(props: {
    promptId: string;
    version: number;
    userId: string;                  // publishedBy
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
    revalidatePath?: string;
    revisions?: Array<{ revisionNumber: number; label?: string }>; // si ya las traes
}) {
    const { promptId, version, userId, onVersionChange, onConflict, revalidatePath, revisions = [] } = props;
    const [note, setNote] = useState("");
    const [rev, setRev] = useState<number | undefined>(undefined);

    const { loading, error, save, publish, revert } = usePromptActions({
        promptId,
        version,
        publishedBy: userId,
        onVersionChange,
        onConflict,
        revalidatePath,
    });

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={save} disabled={loading !== null} className="gap-2" variant="secondary">
                <CheckCircle2 className="h-4 w-4" />
                Guardar
            </Button>

            <div className="flex items-center gap-2">
                <Input
                    placeholder="Nota de publicación (opcional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-9 w-[240px]"
                />
                <Button onClick={() => publish(note)} disabled={loading !== null} className="gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Publicar
                </Button>
            </div>

            <div className="flex items-center gap-2">
                {revisions.length > 0 && (
                    <select
                        className="h-9 rounded-md border px-2 text-sm"
                        value={rev ?? ""}
                        onChange={(e) => setRev(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">Selecciona revisión…</option>
                        {revisions.map(r => (
                            <option key={r.revisionNumber} value={r.revisionNumber}>
                                {r.label ?? `Rev #${r.revisionNumber}`}
                            </option>
                        ))}
                    </select>
                )}
                {/* <Button
                    variant="outline"
                    onClick={() => rev !== undefined && revert(rev)}
                    disabled={loading !== null || rev === undefined}
                    className="gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Revertir
                </Button> */}
            </div>

            {loading && <span className="text-xs text-muted-foreground">Procesando…</span>}
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    );
}
