"use client";

import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Plus, X } from "lucide-react";
import { CONSULTA_DATOS_SNIPPET, CAPTURE_SNIPPETS, QaItem, ProductItemDTO, ExtraItemDTO, FnSelector } from "@/types/agentAi";
import { PedidoFieldsEditor } from "../PedidoFieldsEditor";


export function FunctionSelectorInline<T extends QaItem | ProductItemDTO | ExtraItemDTO>({
    mode,
    items,
    addItem,
    flows = [],
    notificationNumber,
}: FnSelector<T>) {
    const [selected, setSelected] = useState<string | null>(null);
    const [subtype, setSubtype] = useState<string | null>(null);
    const [pedidoFields, setPedidoFields] = useState<string[]>([]);
    const [ruleText, setRuleText] = useState<string>("");

    // ========= Adapters por colección (normalización) =========
    // Cómo crear un item (id/título/desc) a partir de un "preset"
    const adapter = useMemo(() => {
        switch (mode) {
            case "faq":
                return {
                    // Para FAQ, los "items" son Q/A. Usaremos "addItem" cuando queramos crear nuevas Q/A
                    makeItemFromPreset: (title: string, content?: string) =>
                        ({ id: nanoid(), q: title, a: content ?? "" }) as T,
                    displayTitle: (it: T) => (it as QaItem).q,
                    displaySubtitle: (it: T) => (it as QaItem).a?.slice(0, 80),
                };
            case "products":
                return {
                    makeItemFromPreset: (title: string, content?: string) =>
                        ({ id: nanoid(), name: title, description: content ?? "" }) as T,
                    displayTitle: (it: T) => (it as ProductItemDTO).name,
                    displaySubtitle: (it: T) => (it as ProductItemDTO).description?.slice(0, 80),
                };
            case "extras":
            default:
                return {
                    makeItemFromPreset: (title: string, content?: string) =>
                        ({ id: nanoid(), title, content: content ?? "" }) as T,
                    displayTitle: (it: T) => (it as ExtraItemDTO).title,
                    displaySubtitle: (it: T) => (it as ExtraItemDTO).content?.slice(0, 80),
                };
        }
    }, [mode]);

    // ========= Helpers de presets (acciones) =========
    // Cada acción puede:
    //  A) Crear un nuevo item (addItem) con title/content normalizados
    const createItemFromAction = (title: string, full?: string) => {
        const item = adapter.makeItemFromPreset(title, full);
        addItem(item);
    };

    // ========= Handlers de acciones existentes =========
    const handleInsertEjecutarFlujo = (name: string) => {
        const title = `función — ${name}`;
        const full =
            `> Función: Ejecuta el flujo '${name.toUpperCase()}'\n` +
            `* **Comportamiento:** Después de ejecutar el flujo, tu única respuesta es la que se te indique en **Regla/parámetro**.`
        createItemFromAction(title, full);
        setSelected(null);
    };

    const handleInsertConsulta = () => {
        const title = "Consultar productos";
        const full = CONSULTA_DATOS_SNIPPET;

        createItemFromAction(title, full);
        setSelected(null);
    };

    const handleInsertNotificar = () => {
        const title = "Notificar asesor";
        const full = `> Notificar asesor: ${notificationNumber ?? ""}`;

        createItemFromAction(title, full);
        setSelected(null);
    };

    const handleInsertCaptura = (tipo: string) => {
        const base = CAPTURE_SNIPPETS[tipo as keyof typeof CAPTURE_SNIPPETS];
        const hasFields = tipo === "Pedidos" && pedidoFields.length > 0;

        let title = `Captura — ${tipo}`;
        let full = `> Captura de datos — ${tipo}: **${base}**`;
        if (hasFields) {
            title += ` (${pedidoFields.length})`;
            full += `\nCampos: ${pedidoFields.join(", ")}`;
        }

        createItemFromAction(title, full);
        setSelected(null);
    };

    const handleInsertRule = () => {
        const value = ruleText.trim();
        if (!value) return;
        const title = "Regla/parámetro";
        const full = `> Regla/parámetro: ${value}`;

        createItemFromAction(title, full);
        setRuleText("");
        setSelected(null);
    };

    // ========= Gestión local de campos para "Pedidos" =========
    const addPedidoField = (field: string) => {
        const f = field.trim();
        if (!f) return;
        setPedidoFields((prev) => Array.from(new Set([...prev, f])));
    };
    const removePedidoField = (field: string) =>
        setPedidoFields((prev) => prev.filter((f) => f !== field));

    // ========= UI =========
    return (
        <div className="flex flex-1 flex-col">
            {/* Selector principal */}
            <div className="flex w-full justify-end gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="default" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Acción
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[320px]" align="end">
                        <Command>
                            <CommandInput placeholder="Buscar opción…" />
                            <CommandList>
                                <CommandEmpty>Sin coincidencias…</CommandEmpty>

                                <CommandGroup heading="OPCIÓN #1 · Ejecutar flujo">
                                    <CommandItem onSelect={() => setSelected("ejecutar_flujo")}>
                                        Seleccionar flujo
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #2 · Consulta de datos">
                                    <CommandItem onSelect={handleInsertConsulta}>
                                        Agregar “Consultar Productos”
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #3 · Captura de datos">
                                    {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => (
                                        <CommandItem key={opt} onSelect={() => { setSelected("captura_datos"); setSubtype(opt); }}>
                                            {opt}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #4 · Notificar asesor">
                                    <CommandItem onSelect={handleInsertNotificar}>
                                        Usar número de notificación del perfil
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Button onClick={() => setSelected("add_rule")} variant="outline">
                    Regla
                </Button>
            </div>

            <div className="flex flex-1 flex-col w-full justify-center items-center">
                {/* Subcomponente: ejecutar_flujo */}
                {selected === "ejecutar_flujo" && (
                    <Card className="bg-muted/20 border-muted/60">
                        <CardHeader className="py-3 flex-row items-center justify-between">
                            <CardTitle className="text-sm">Seleccionar flujo</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
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
                                                        <CommandItem key={f.id} onSelect={() => handleInsertEjecutarFlujo(f.name)}>
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

                {/* Subcomponente: captura_datos */}
                {selected === "captura_datos" && subtype && (
                    <Card className="bg-muted/20 border-muted/60">
                        <CardHeader className="py-3 flex-row items-center justify-between">
                            <CardTitle className="text-sm">Captura de datos — {subtype}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {subtype === "Pedidos" ? (
                                <div className="px-2">
                                    <PedidoFieldsEditor
                                        stepId="faq" // valores dummy
                                        elId="captura"
                                        element={{ id: "x", kind: "function", fn: "captura_datos", subtype: "Pedidos", prompt: "", fields: pedidoFields }}
                                        onAdd={addPedidoField}
                                        onRemove={removePedidoField}
                                    />

                                    <div className="flex justify-end pt-2">
                                        <Button size="sm" variant="default" onClick={() => handleInsertCaptura("Pedidos")}>
                                            Insertar captura con campos
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-end">
                                    <Button size="sm" variant="default" onClick={() => handleInsertCaptura(subtype)}>
                                        Insertar captura
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Subcomponente: add_rule */}
                {selected === "add_rule" && (
                    <Card className="bg-muted/30 border-muted/60">
                        <CardHeader className="py-3 flex-row items-center justify-between">
                            <CardTitle className="text-sm">Regla/parámetro</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Textarea
                                placeholder="Regla adicional para este paso…"
                                value={ruleText}
                                onChange={(e) => setRuleText(e.target.value)}
                                className="min-h-[72px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelected(null)}>
                                    Cancelar
                                </Button>
                                <Button variant="default" onClick={handleInsertRule}>
                                    Insertar regla
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}