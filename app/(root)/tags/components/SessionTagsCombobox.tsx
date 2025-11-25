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

    const summaryLabel = () => {
        if (selectedIds.length === 0) return "Sin etiquetas";

        const selectedTags = allTags.filter((t) => selectedIds.includes(t.id));
        if (selectedTags.length === 0) return "Sin etiquetas";

        const names = selectedTags.map((t) => t.name);
        if (names.length <= 2) return names.join(", ");

        return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
    };

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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-8 w-full justify-between px-2 text-xs"
                    disabled={isPending || allTags.length === 0}
                >
                    <span className="flex items-center gap-1 truncate">
                        <TagIcon className="h-3 w-3 opacity-70" />
                        <span className="truncate">{summaryLabel()}</span>
                    </span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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