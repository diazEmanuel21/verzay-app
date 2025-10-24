"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { FnSelectorInterface } from "@/types/agentAi";
import { Zap, Plus, X } from "lucide-react";

/**
 * Selector principal con 5 opciones y subcomponentes dinámicos
 */
export const FunctionSelectorInline = ({ onInsert, flows = [] }: FnSelectorInterface) => {
    const [selected, setSelected] = useState<string | null>(null);

    // Inserta texto sin reemplazar
    const insert = (text: string) => onInsert(text);

    // Limpia selección
    const reset = () => setSelected(null);

    return (
        <div className="space-y-3">
            {/* Selector principal */}
            <div className="flex w-ful justify-end">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="default" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Agregar Acción
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[320px]" align="end">
                        <Command>
                            <CommandInput placeholder="Buscar opción…" />
                            <CommandList>
                                <CommandEmpty>Sin coincidencias…</CommandEmpty>

                                <CommandGroup heading="OPCIÓN #1 · Ejecutar flujo">
                                    <CommandItem onSelect={() => setSelected("flujo")}>
                                        Seleccionar flujo
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #2 · Consulta de datos">
                                    <CommandItem onSelect={() => insert("> Consulta de datos: **[consulta]**")}>
                                        Agregar “Consultar Productos”
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #3 · Captura de datos">
                                    {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => (
                                        <CommandItem
                                            key={opt}
                                            onSelect={() => insert(`> Captura de datos — ${opt}: **[prompt]**`)}
                                        >
                                            {opt}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #4 · Notificar asesor">
                                    <CommandItem onSelect={() => insert("> Notificar asesor")}>
                                        Usar número de notificación del perfil
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #5 · Agregar Regla">
                                    <CommandItem
                                        onSelect={() => insert("> Agregar regla: [descripción de la regla]")}
                                    >
                                        Agrega pautas/parametros al prompt
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Subcomponente dinámico */}
            {selected === "flujo" && (
                <Card className="bg-muted/20 border-muted/60">
                    <CardHeader className="py-3 flex-row items-center justify-between">
                        <CardTitle className="text-sm">Seleccionar flujo</CardTitle>
                        <Button variant="ghost" size="icon" onClick={reset}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {flows.length === 0 && (
                            <div className="text-sm text-muted-foreground">No hay flujos disponibles</div>
                        )}

                        {flows.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        Elegir flujo…
                                        <Plus className="h-4 w-4 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="p-0 w-[320px]">
                                    <Command>
                                        <CommandInput placeholder="Buscar flujo…" />
                                        <CommandList>
                                            <CommandEmpty>Sin resultados…</CommandEmpty>
                                            <CommandGroup>
                                                {flows.map((f) => (
                                                    <CommandItem
                                                        key={f.id}
                                                        onSelect={() => {
                                                            insert(`> Ejecutar flujo: **${f.name}**`);
                                                            reset();
                                                        }}
                                                    >
                                                        {f.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
