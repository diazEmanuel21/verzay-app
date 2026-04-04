"use client";

import { X } from "lucide-react";
import type { SimpleTag } from "@/types/session";

type TagFilterPanelProps = {
  onClearFilter: () => void;
  onToggleTag: (tagId: number) => void;
  selectedTagIds: Set<number>;
  tags: SimpleTag[];
};

export function TagFilterPanel({
  onClearFilter,
  onToggleTag,
  selectedTagIds,
  tags,
}: TagFilterPanelProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Etiquetas
        </span>
        {selectedTagIds.size > 0 && (
          <button
            type="button"
            onClick={onClearFilter}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {tags
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((tag) => {
            const isActive = selectedTagIds.has(tag.id);
            const color = tag.color ?? "#6366F1";
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all"
                style={
                  isActive
                    ? { background: color, borderColor: color, color: "#fff" }
                    : { borderColor: `${color}60`, color, background: `${color}15` }
                }
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: isActive ? "rgba(255,255,255,0.7)" : color }}
                />
                {tag.name}
              </button>
            );
          })}
      </div>
      {selectedTagIds.size > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Mostrando contactos con{" "}
          <span className="font-semibold">cualquiera</span> de las etiquetas seleccionadas.
        </p>
      )}
    </div>
  );
}
