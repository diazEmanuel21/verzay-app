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
    updateTagAction,
} from "@/actions/tag-actions";
import { SimpleTag } from "@/types/session";
import { Trash2, Pencil, Tag as TagIcon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface SessionTagsManagerProps {
    userId: string;
    sessionId: number;
    allTags: SimpleTag[];
    initialSelectedTagIds: number[];
}

const COLOR_PRESETS = [
    "#3B82F6", // azul
    "#22C55E", // verde
    "#F97316", // naranja
    "#EC4899", // rosa
    "#A855F7", // morado
    "#F59E0B", // amarillo
];

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
    const [newTagColor, setNewTagColor] = useState<string | null>(null);

    // Edición de tag
    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState<string | null>(null);

    // Eliminación con confirmación
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<SimpleTag | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

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

                toast.error(res.message || "No se pudo actualizar la etiqueta.");
            } else {
                toast.success(res.message || "Etiquetas actualizadas.");
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
                color: newTagColor,
            });

            if (!res.success || !res.data) {
                toast.error(res.message || "No se pudo crear la etiqueta.");
                return;
            }

            const newTag: SimpleTag = {
                id: res.data.id,
                name: res.data.name,
                slug: (res.data as any).slug,
                color: (res.data as any).color ?? null,
            };

            setTags((prev) => [...prev, newTag]);
            setNewTagName("");
            setNewTagColor(null);

            toast.success("Etiqueta creada", {
                description: `Se creó la etiqueta "${newTag.name}".`,
            });
        });
    };

    const startEditTag = (tag: SimpleTag) => {
        setEditingTagId(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color ?? null);
    };

    const handleSaveEditTag = () => {
        if (!editingTagId) return;
        const value = editName.trim();
        if (!value) return;

        const tagId = editingTagId;

        startTransition(async () => {
            const res = await updateTagAction({
                id: tagId,
                userId,
                name: value,
                color: editColor,
            });

            if (!res.success || !res.data) {
                toast.error(res.message || "No se pudo actualizar la etiqueta.");
                return;
            }

            setTags((prev) =>
                prev.map((t) =>
                    t.id === tagId
                        ? {
                            ...t,
                            name: res.data!.name,
                            slug: (res.data as any).slug,
                            color: (res.data as any).color ?? null,
                        }
                        : t
                )
            );

            setEditingTagId(null);
            toast.success("Etiqueta actualizada", {
                description: `Se actualizó la etiqueta "${value}".`,
            });
        });
    };

    const openDeleteDialog = (tag: SimpleTag) => {
        setTagToDelete(tag);
        setDeleteConfirmText("");
        setDeleteDialogOpen(true);
    };

    const handleDeleteTag = () => {
        if (!tagToDelete) return;

        const tag = tagToDelete;

        startTransition(async () => {
            const res = await deleteTagAction({
                id: tag.id,
                userId,
            });

            if (!res.success) {
                toast.error(res.message || "No se pudo eliminar la etiqueta.");
                return;
            }

            // Quitar de lista
            setTags((prev) => prev.filter((t) => t.id !== tag.id));
            // Quitar de seleccionados
            setSelectedIds((prev) => prev.filter((id) => id !== tag.id));

            setDeleteDialogOpen(false);
            setTagToDelete(null);

            toast.success("Etiqueta eliminada", {
                description: `"${tag.name}" se eliminó correctamente.`,
            });
        });
    };

    const renderColorDot = (color?: string | null) => (
        <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-border/60"
            style={color ? { backgroundColor: color } : {}}
        />
    );

    return (
        <>
            <div className="space-y-4 rounded-lg border bg-card p-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Etiquetas de la sesión</h3>
                    </div>
                    {isPending && (
                        <span className="text-muted-foreground">Guardando...</span>
                    )}
                </div>

                {/* Tags asignados */}
                <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">
                        Asignadas a esta sesión
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.filter((t) => selectedIds.includes(t.id)).length === 0 ? (
                            <span className="text-muted-foreground">
                                Sin etiquetas asignadas.
                            </span>
                        ) : (
                            tags
                                .filter((t) => selectedIds.includes(t.id))
                                .map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        className="flex items-center gap-1 rounded-full px-2 py-1"
                                    >
                                        {renderColorDot(tag.color)}
                                        {tag.name}
                                    </Badge>
                                ))
                        )}
                    </div>
                </div>

                <hr className="my-1 border-border/50" />

                {/* Crear nueva etiqueta */}
                <div className="space-y-2">
                    <p className="font-medium text-muted-foreground">
                        Crear nueva etiqueta
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            placeholder="Nombre (ej: Lead, Prospecto...)"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="h-9"
                        />
                        {/* selector de color */}
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() =>
                                            setNewTagColor((current) =>
                                                current === color ? null : color
                                            )
                                        }
                                        className={cn(
                                            "h-6 w-6 rounded-full border border-border/60",
                                            newTagColor === color && "ring-2 ring-primary"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <Input
                                type="color"
                                value={newTagColor ?? "#3B82F6"}
                                onChange={(e) => setNewTagColor(e.target.value)}
                                className="h-9 w-12 cursor-pointer p-1"
                                title="Color personalizado"
                            />
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            className="h-9 px-4"
                            disabled={isPending || !newTagName.trim()}
                            onClick={handleCreateTag}
                        >
                            Añadir
                        </Button>
                    </div>
                </div>

                {/* Lista completa de etiquetas */}
                <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">
                        Catálogo de etiquetas
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {tags.length === 0 ? (
                            <span className="text-muted-foreground">
                                Aún no hay etiquetas creadas.
                            </span>
                        ) : (
                            tags.map((tag) => {
                                const active = isSelected(tag.id);
                                const isEditing = editingTagId === tag.id;

                                if (isEditing) {
                                    return (
                                        <div
                                            key={tag.id}
                                            className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2"
                                        >
                                            <div className="flex flex-1 min-w-[160px] items-center gap-2">
                                                {renderColorDot(editColor)}
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {COLOR_PRESETS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() =>
                                                            setEditColor((current) =>
                                                                current === color ? null : color
                                                            )
                                                        }
                                                        className={cn(
                                                            "h-5 w-5 rounded-full border border-border/60",
                                                            editColor === color && "ring-2 ring-primary"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                <Input
                                                    type="color"
                                                    value={editColor ?? "#3B82F6"}
                                                    onChange={(e) => setEditColor(e.target.value)}
                                                    className="h-9 w-12 cursor-pointer p-1"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3"
                                                    onClick={handleSaveEditTag}
                                                    disabled={isPending || !editName.trim()}
                                                >
                                                    Guardar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-3"
                                                    onClick={() => setEditingTagId(null)}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={tag.id}
                                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                                    >
                                        {/* Clic en el chip asigna / desasigna a la sesión */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTag(tag.id)}
                                            className={cn(
                                                "inline-flex min-w-[120px] flex-1 items-center gap-2 rounded-full px-3 py-1 text-left transition",
                                                active
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-background text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {renderColorDot(tag.color)}
                                            <span className="truncate">{tag.name}</span>
                                        </button>

                                        {/* Acciones: editar / eliminar */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                onClick={() => startEditTag(tag)}
                                                title="Editar etiqueta"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => openDeleteDialog(tag)}
                                                title="Eliminar etiqueta"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Dialog de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar etiqueta</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Esta acción eliminará la etiqueta de todo tu CRM y se
                                desasignará de todas las sesiones.
                            </p>
                            {tagToDelete && (
                                <>
                                    <p>
                                        Para confirmar, escribe{" "}
                                        <span className="font-semibold">
                                            {tagToDelete.name}
                                        </span>{" "}
                                        en el campo de abajo.
                                    </p>
                                    <Input
                                        autoFocus
                                        placeholder={tagToDelete.name}
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        className="mt-1 h-9"
                                    />
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setDeleteConfirmText("");
                                setTagToDelete(null);
                            }}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            disabled={
                                !tagToDelete ||
                                deleteConfirmText.trim() !== tagToDelete.name.trim()
                            }
                            onClick={handleDeleteTag}
                        >
                            Eliminar etiqueta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};