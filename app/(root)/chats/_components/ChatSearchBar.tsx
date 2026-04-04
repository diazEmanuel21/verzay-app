"use client";

import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatSearchBarProps = {
  filterActive: boolean;
  filterCount: number;
  onClear: () => void;
  onChange: (value: string) => void;
  onToggleFilter: () => void;
  showFilter: boolean;
  value: string;
};

export function ChatSearchBar({
  filterActive,
  filterCount,
  onClear,
  onChange,
  onToggleFilter,
  showFilter,
  value,
}: ChatSearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sm font-bold tracking-tight text-foreground">Chats</span>
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar..."
          className="h-8 rounded-full pl-7 pr-7 text-xs"
          aria-label="Buscar chats"
        />
        {value && (
          <button
            type="button"
            aria-label="Limpiar busqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {showFilter && (
        <button
          type="button"
          aria-label="Filtrar por etiquetas"
          title="Filtrar por etiquetas"
          onClick={onToggleFilter}
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
            filterActive || filterCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {filterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
