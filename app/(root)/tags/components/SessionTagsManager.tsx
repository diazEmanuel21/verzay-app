"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    assignTagToSessionAction,
    removeTagFromSessionAction,
    createTagAction,
    deleteTagAction,
} from "@/actions/tag-actions";
import { Trash2 } from "lucide-react";
import { SimpleTag } from "@/types/session";

interface SessionTagsManagerProps {
    userId: string;
    sessionId: number;
    allTags: SimpleTag[];
    initialSelectedTagIds: number[];
}

export const SessionTagsManager = ({
    userId,
    sessionId,
    allTags,
    initialSelectedTagIds,
}: SessionTagsManagerProps) => {
    const [isPending, startTransition] = useTransition();

    const [tags, setTags] = useState<SimpleTag[]>(allTags);
    const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedTagIds);
    const [newTagName, setNewTagName] = useState("");

    const isSelected = (id: number) => selectedIds.includes(id);

    const handleToggleTag = (tagId: number) => {
        const currentlySelected = isSelected(tagId);

        // Optimista
        setSelectedIds((prev) =>
            currentlySelected ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );

        startTransition(async () => {
            const res = currentlySelected
                ? await removeTagFromSessionAction({ userId, sessionId, tagId })
                : await assignTagToSessionAction({ userId, sessionId, tagId });

            if (!res.success) {
                // revertir optimista si falló
                setSelectedIds((prev) =>
                    currentlySelected ? [...prev, tagId] : prev.filter((id) => id !== tagId)
                );

                toast.error(res.message || "No se pudo actualizar el tag.");
            } else {
                toast.success(res.message || "Tags actualizados.");
            }
        });
    };

    const handleCreateTag = () => {
        const value = newTagName.trim();
        if (!value) return;

        startTransition(async () => {
            const res = await createTagAction({
                userId,
                name: value,
                color: null,
            });

            if (!res.success || !res.data) {
                toast.error(res.message || "No se pudo crear el tag.");
                return;
            }

            // ✅ Narrow y mapeo explícito para evitar el error (SimpleTag | undefined)
            const newTag: SimpleTag = {
                id: res.data.id,
                name: res.data.name,
                slug: (res.data as any).slug,
                color: (res.data as any).color ?? null,
            };

            setTags((prev) => [...prev, newTag]);
            setNewTagName("");

            toast.success("Tag creado", {
                description: `Se creó el tag "${newTag.name}".`,
            });
        });
    };

    const handleDeleteTag = (tag: SimpleTag) => {
        const confirmDelete = window.confirm(
            `¿Eliminar el tag "${tag.name}"? Se quitará de todas las sesiones.`
        );
        if (!confirmDelete) return;

        startTransition(async () => {
            const res = await deleteTagAction({
                id: tag.id,
                userId,
            });

            if (!res.success) {
                toast.error(res.message || "No se pudo eliminar el tag.");
                return;
            }

            // Quitar de lista
            setTags((prev) => prev.filter((t) => t.id !== tag.id));
            // Quitar de seleccionados
            setSelectedIds((prev) => prev.filter((id) => id !== tag.id));

            toast.success("Tag eliminado", {
                description: `"${tag.name}" se eliminó correctamente.`,
            });
        });
    };

    return (
        <div className="space-y-3 rounded-lg border bg-card p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm">Etiquetas de la sesión</h3>
                {isPending && (
                    <span className="text-[10px] text-muted-foreground">
                        Guardando...
                    </span>
                )}
            </div>

            {/* Tags asignados (vista rápida) */}
            <div className="flex flex-wrap gap-1">
                {tags.filter((t) => selectedIds.includes(t.id)).length === 0 ? (
                    <span className="text-[11px] text-muted-foreground">
                        Sin tags asignados.
                    </span>
                ) : (
                    tags
                        .filter((t) => selectedIds.includes(t.id))
                        .map((tag) => (
                            <Badge
                                key={tag.id}
                                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                            >
                                {tag.name}
                            </Badge>
                        ))
                )}
            </div>

            <hr className="my-1 border-border/50" />

            {/* Crear nuevo tag */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Nuevo tag (ej: Lead, Prospecto...)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-8 text-xs"
                />
                <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isPending || !newTagName.trim()}
                    onClick={handleCreateTag}
                >
                    Añadir
                </Button>
            </div>

            {/* Lista completa de tags (click para asignar / quitar) */}
            <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                    Todos los tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {tags.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground">
                            Aún no hay tags creados.
                        </span>
                    ) : (
                        tags.map((tag) => {
                            const active = isSelected(tag.id);

                            return (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleToggleTag(tag.id)}
                                    className={[
                                        "group inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition",
                                        active
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-foreground hover:bg-muted",
                                    ].join(" ")}
                                >
                                    <span>{tag.name}</span>
                                    {/* Botón de borrar tag */}
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTag(tag);
                                        }}
                                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-background/40 text-[10px] text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                        title="Eliminar tag"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
