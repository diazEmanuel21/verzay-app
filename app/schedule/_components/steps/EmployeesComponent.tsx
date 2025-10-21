"use client";

import { FC, useMemo, useState } from "react";
import { Search, Users, Check, X, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Employee } from "@prisma/client";



type EmployeesComponentProps = {
  employees?: Employee[];
  defaultSelectedIds?: string[];
  selectionMode?: "single" | "multiple";
  onChange?: (ids: string[]) => void;
  onContinue?: (ids: string[]) => void;
  onBack?: () => void; // 👈 nuevo callback para el botón Atrás
};

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export const EmployeesComponent: FC<EmployeesComponentProps> = ({
  employees = [],
  defaultSelectedIds = [],
  selectionMode = "single",
  onChange,
  onContinue,
  onBack, // 👈 lo recibimos como prop
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(defaultSelectedIds);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.role, e.email, e.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (selectionMode === "single") {
        const next = prev[0] === id ? [] : [id];
        onChange?.(next);
        return next;
      }
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      onChange?.(next);
      return next;
    });
  };

  const clearOne = (id: string) => {
    setSelected((prev) => {
      const next = prev.filter((x) => x !== id);
      onChange?.(next);
      return next;
    });
  };

  const clearAll = () => {
    setSelected([]);
    onChange?.([]);
  };

  const handleContinue = () => {
    onContinue?.(selected);
  };

  return (
    <Card className="border-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecciona uno para continuar
          </CardTitle>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Para agendar en el siguiente paso
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Primero elige quién atenderá. Luego verás horas disponibles.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, rol, email o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Seleccionados:</span>
            {selected.map((id) => {
              const emp = employees.find((e) => e.id === id);
              if (!emp) return null;
              return (
                <Badge key={id} variant="secondary" className="gap-1">
                  {emp.name}
                  <button
                    type="button"
                    onClick={() => clearOne(id)}
                    className="ml-1 inline-flex"
                    aria-label={`Quitar ${emp.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
              Limpiar
            </Button>
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        <ScrollArea className="max-h-[360px]">
          <ul className="divide-y">
            {filtered.map((e) => {
              const isSelected = selected.includes(e.id);
              return (
                <li key={e.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(e.id)}
                      className="mt-0.5"
                      aria-label={`Seleccionar ${e.name}`}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(e.name).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium leading-none truncate">{e.name}</span>
                        {!e.isActive && (
                          <Badge variant="destructive" className="h-5 text-[10px]">
                            Inactivo
                          </Badge>
                        )}
                        {e.role && (
                          <Badge variant="outline" className="h-5 text-[10px]">
                            {e.role}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {e.email && <span className="truncate">{e.email}</span>}
                        {e.phone && <span className="truncate">{e.phone}</span>}
                      </div>
                    </div>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn("gap-1", isSelected && "border-primary")}
                      onClick={() => toggle(e.id)}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : null}
                      {isSelected ? "Seleccionado" : "Elegir"}
                    </Button>
                  </div>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No se encontraron empleados con “{query}”.
              </li>
            )}
          </ul>
        </ScrollArea>

        {/* 🔙 Botones inferiores */}
        <div className="p-4 flex items-center justify-between gap-3 border-t">
          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>

          <div className="flex-1 text-center text-xs text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} — {selected.length} seleccionado
            {selected.length !== 1 ? "s" : ""}
          </div>

          <Button onClick={handleContinue} disabled={selected.length === 0}>
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};