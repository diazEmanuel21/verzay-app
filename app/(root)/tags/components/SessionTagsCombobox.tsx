"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronsUpDown, Check, Tag as TagIcon } from "lucide-react";
import {
    assignTagToSessionAction,
    removeTagFromSessionAction,
} from "@/actions/tag-actions";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SimpleTag = {
    id: number;
    name: string;
    slug?: string;
    color?: string | null;        // ej: "#22c55e" o "hsl(var(--primary))"
    sessionCount?: number | null; // cantidad de sesiones con esta tag
};

interface SessionTagsComboboxProps {
    userId: string;
    sessionId: number;
    allTags: SimpleTag[];
    initialSelectedIds: number[];
}

export function SessionTagsCombobox({
    userId,
    sessionId,
    allTags,
    initialSelectedIds,
}: SessionTagsComboboxProps) {
    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
    const [isPending, startTransition] = useTransition();

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
                // revertir si falló
                setSelectedIds((prev) =>
                    currentlySelected ? [...prev, tagId] : prev.filter((id) => id !== tagId)
                );

                toast.error(res.message || "No se pudo actualizar las etiquetas.");
            } else {
                toast.success(res.message || "Etiquetas actualizadas.");
            }
        });
    };

    const summaryLabel = (): React.ReactNode => {
        if (selectedIds.length === 0) {
            return (
                <span className="flex items-center gap-1 truncate">
                    <TagIcon className="h-3 w-3 opacity-70" />
                </span>
            );
        }

        const selectedTags = allTags.filter((t) => selectedIds.includes(t.id));
        if (selectedTags.length === 0) {
            return (
                <span className="flex items-center gap-1 truncate">
                    <TagIcon className="h-3 w-3 opacity-70" />
                    
                </span>
            );
        }

        const maxVisible = 4; // cuántos iconos mostrar
        const visible = selectedTags.slice(0, maxVisible);
        const remaining = selectedTags.length - visible.length;

        return (
            <span className="flex items-center truncate">
                {visible.map((tag) => (
                    <span
                        key={tag.id}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background/60"
                    >
                        <TagIcon
                            className="h-2.5 w-2.5"
                            style={tag.color ? { color: tag.color } : undefined}
                        />
                        {/* accesibilidad: nombre solo para lectores de pantalla */}
                        <span className="sr-only">{tag.name}</span>
                    </span>
                ))}

                {remaining > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                        +{remaining}
                    </span>
                )}
            </span>
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-8 justify-between px-2 text-xs"
                    disabled={isPending || allTags.length === 0}
                >
                    <span className="flex items-center gap-1 truncate">
                        <span className="truncate">{summaryLabel()}</span>
                    </span>
                    <ChevronsUpDown className="" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-60 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar etiqueta..." className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty className="text-xs">
                            No se encontraron etiquetas.
                        </CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {allTags.map((tag) => {
                                const active = isSelected(tag.id);
                                const count = tag.sessionCount ?? 0;

                                return (
                                    <CommandItem
                                        key={tag.id}
                                        onSelect={() => handleToggleTag(tag.id)}
                                        className="flex items-center justify-between gap-2 text-xs"
                                    >
                                        {/* Lado izquierdo: check + icono de color + nombre */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Check
                                                className={cn(
                                                    "h-3 w-3",
                                                    active ? "opacity-100" : "opacity-0"
                                                )}
                                            />

                                            {/* Icono Tag con el color propio de la etiqueta */}
                                            <TagIcon
                                                className="h-3 w-3 shrink-0"
                                                style={
                                                    tag.color
                                                        ? { color: tag.color }
                                                        : undefined // fallback al color actual
                                                }
                                            />

                                            <span className="truncate">{tag.name}</span>
                                        </div>

                                        {/* Lado derecho: badge con cantidad */}
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 px-1.5 py-0.5 text-[10px] leading-none"
                                        >
                                            {count}
                                        </Badge>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}