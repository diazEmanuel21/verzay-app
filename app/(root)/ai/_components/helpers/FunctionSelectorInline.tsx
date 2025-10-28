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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONSULTA_DATOS_SNIPPET, CAPTURE_SNIPPETS, FnSelectorInterface } from "@/types/agentAi";
import { Zap, Plus, X } from "lucide-react";
import { PedidoFieldsEditor } from "../PedidoFieldsEditor";
import { Textarea } from "@/components/ui/textarea";

export const FunctionSelectorInline = ({
    onInsert,
    flows = [],
    notificationNumber,
}: FnSelectorInterface) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [subtype, setSubtype] = useState<string | null>(null);
    const [pedidoFields, setPedidoFields] = useState<string[]>([]);

    // 🔹 NUEVO: estado local para "rules"
    const [ruleText, setRuleText] = useState<string>("");

    // Inserta texto sin reemplazar
    const insert = (text: string) => onInsert(text);
    const reset = () => {
        setSelected(null);
        setSubtype(null);
        setPedidoFields([]);
        setRuleText("");
    };

    /* 🔹 Inserta captura con campos si es Pedidos */
    const handleInsertCaptura = (tipo: string) => {
        const basePrompt = CAPTURE_SNIPPETS[tipo as keyof typeof CAPTURE_SNIPPETS];
        let texto = `> Captura de datos — ${tipo}: **${basePrompt}**`;
        if (tipo === "Pedidos" && pedidoFields.length > 0) {
            texto += `\nCampos: ${pedidoFields.join(", ")}`;
        }
        insert(texto);
        reset();
    };

    /* 🔹 Agregar campo de pedido (solo local) */
    const addPedidoField = (field: string) => {
        if (!field.trim()) return;
        setPedidoFields((prev) => Array.from(new Set([...prev, field.trim()])));
    };

    const removePedidoField = (field: string) => {
        setPedidoFields((prev) => prev.filter((f) => f !== field));
    };

    /* 🔹 NUEVO: insertar regla/parámetro */
    const handleInsertRule = () => {
        const value = ruleText.trim();
        if (!value) return;
        // Formato consistente con tus otros bloques
        insert(`> Regla/parámetro: ${value}`);
        reset();
    };

    return (
        <div className="space-y-3">
            {/* Selector principal */}
            <div className="flex w-full justify-end gap-2">
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
                                    <CommandItem onSelect={() => setSelected("ejecutar_flujo")}>
                                        Seleccionar flujo
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #2 · Consulta de datos">
                                    <CommandItem onSelect={() => insert(CONSULTA_DATOS_SNIPPET)}>
                                        Agregar “Consultar Productos”
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #3 · Captura de datos">
                                    {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => (
                                        <CommandItem
                                            key={opt}
                                            onSelect={() => {
                                                setSelected("captura_datos");
                                                setSubtype(opt);
                                            }}
                                        >
                                            {opt}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="OPCIÓN #4 · Notificar asesor">
                                    <CommandItem onSelect={() => insert(`> Notificar asesor: ${notificationNumber}`)}>
                                        Usar número de notificación del perfil
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Button onClick={() => setSelected("add_rule")} variant={"outline"}>
                    Agregar regla
                </Button>
            </div>

            {/* Subcomponente: ejecutar_flujo */}
            {selected === "ejecutar_flujo" && (
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
                                                {/* //TODO: EN LOS FIELD CON PROMPT SOLO DEBE DE SALIR UNA PEQUEÑA PARTE, POR EX: EN FLUJO SALE, EJECUTAR FLUJO: NOMBRE */}
                                                {/* //TODO: IMITAR COMPORTAMIENTO DE PASOS */}
                                                {flows.map((f) => (
                                                    <CommandItem
                                                        key={f.id}
                                                        onSelect={() => {
                                                            insert(
                                                                `> función: Ejecuta el flujo '${f.name.toUpperCase()}'\n* **Poscondición de la función:** Tras ejecutar el flujo, **envía solo su salida literal de ‘Regla/parámetro’**; si no hay orden clara, **formula 1 pregunta contextual mínima** que guíe al siguiente paso lógico de conversión.`
                                                            );
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

            {/* Subcomponente: captura_datos */}
            {selected === "captura_datos" && subtype && (
                <Card className="bg-muted/20 border-muted/60">
                    <CardHeader className="py-3 flex-row items-center justify-between">
                        <CardTitle className="text-sm">Captura de datos — {subtype}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={reset}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {subtype === "Pedidos" ? (
                            <div className="px-2">
                                <PedidoFieldsEditor
                                    stepId="faq" // valores dummy
                                    elId="captura"
                                    element={{
                                        id: "x",
                                        kind: "function",
                                        fn: "captura_datos",
                                        subtype: "Pedidos",
                                        prompt: "",
                                        fields: pedidoFields,
                                    }}
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

            {/* 🔹 Subcomponente: add_rule */}
            {selected === "add_rule" && (
                <Card className="bg-muted/30 border-muted/60">
                    <CardHeader className="py-3 flex-row items-center justify-between">
                        <CardTitle className="text-sm">Regla/parámetro</CardTitle>
                        <Button variant="ghost" size="icon" onClick={reset}>
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
                            <Button variant="outline" onClick={reset}>
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
    );
};