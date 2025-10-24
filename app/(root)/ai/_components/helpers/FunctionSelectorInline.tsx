import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandSeparator } from "cmdk";
import { Zap } from "lucide-react";

export const FunctionSelectorInline = ({
    onInsert,
}: {
    onInsert: (text: string) => void;
}) => {
    const insert = (text: string) => onInsert(text);

    return (
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
                            <CommandItem onSelect={() =>
                                insert("> Ejecutar flujo: **[nombre_flujo]**")}
                            >
                                Seleccionar flujo
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="OPCIÓN #2 · Consulta de datos">
                            <CommandItem onSelect={() =>
                                insert("> Consulta de datos: **[consulta]**")}
                            >
                                Agregar “Consultar Productos”
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="OPCIÓN #3 · Captura de datos">
                            {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => (
                                <CommandItem key={opt} onSelect={() =>
                                    insert("> Captura de datos — [tipo]: **[prompt]**")}
                                >
                                    {opt}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="OPCIÓN #4 · Notificar asesor">
                            <CommandItem onSelect={() =>
                                insert("> Notificar asesor")}
                            >
                                Usar número de notificación del perfil
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="OPCIÓN #5 · Agregar Regla">
                            <CommandItem onSelect={() =>
                                insert("> Agregar regla: [descripción de la regla]")}
                            >
                                Agrega pautas/parametros al prompt
                            </CommandItem>
                        </CommandGroup>

                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
