import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandEmpty,
    CommandInput,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";

import {
    CAPTURE_SNIPPETS,
    CONSULTA_DATOS_SNIPPET,
    ElementFunction,
    ElementItem,
    ElementText,
    FunctionSelectorInterface,
    PedidoFunctionEl
} from "@/types/agentAi";

import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { nanoid } from "nanoid";

export const FunctionSelector = ({ step, setSteps, notificationNumber }: FunctionSelectorInterface) => {
    const toggleStepPicker = (stepId: string, open: boolean) => {
        setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, openPicker: open } : s)));
    };

    const addText = (stepId: string) => {
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
                    ? { ...s, elements: [...s.elements, { id: nanoid(), kind: "text", text: "" } as ElementText] }
                    : s
            )
        );
    };

    // const addFunctionCaptura = (stepId: string) => {
    // const subtype = "Pedidos" //TODO: ESTO NO DEBE IR QUEMADO
    const addFunctionCaptura = (stepId: string, subtype: "Solicitudes" | "Reclamos" | "Pedidos" | "Reservas") => {
        setSteps((prev) =>
            prev.map((s) => {
                if (s.id !== stepId) return s;
                const base: ElementFunction = {
                    id: nanoid(),
                    kind: "function",
                    fn: "captura_datos",
                    subtype,
                    prompt: CAPTURE_SNIPPETS[subtype],
                };
                const el: ElementItem =
                    subtype === "Pedidos"
                        ? ({ ...base, fields: [] } as PedidoFunctionEl)
                        : base;

                return {
                    ...s,
                    elements: [...s.elements, el],
                    openPicker: false,
                };
            })
        );
    };

    const addFunctionEjecutarFlujo = (stepId: string) => {
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
                    ? {
                        ...s,
                        elements: [
                            ...s.elements,
                            {
                                id: nanoid(),
                                kind: "function",
                                fn: "ejecutar_flujo",
                                flowId: null,
                                flowName: null,
                            } as ElementFunction,
                        ],
                        openPicker: false,
                    }
                    : s
            )
        );
    };

    const addFunctionNotificar = (stepId: string) => {
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
                    ? {
                        ...s,
                        elements: [
                            ...s.elements,
                            {
                                id: nanoid(),
                                kind: "function",
                                fn: "notificar_asesor",
                                notificationNumber: notificationNumber ?? null,
                            } as ElementFunction,
                        ],
                        openPicker: false,
                    }
                    : s
            )
        );
    };

    const addFunctionConsultaDatos = (stepId: string) => {
        setSteps((prev) =>
            prev.map((s) =>
                s.id === stepId
                    ? {
                        ...s,
                        elements: [
                            ...s.elements,
                            {
                                id: nanoid(),
                                kind: "function",
                                fn: "consulta_datos",
                                prompt: CONSULTA_DATOS_SNIPPET,
                            } as ElementFunction,
                        ],
                        openPicker: false,
                    }
                    : s
            )
        );
    };


    return (
        <>
            <Popover open={!!step.openPicker} onOpenChange={(o) => toggleStepPicker(step.id, o)}>
                <PopoverTrigger asChild>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Zap /> Agregar acción
                    </Button>

                </PopoverTrigger>
                <PopoverContent className="p-0 w-[320px]" align="end">
                    <Command>
                        <CommandInput placeholder="Buscar opción…" />
                        <CommandList>
                            <CommandEmpty>Sin coincidencias…</CommandEmpty>

                            <CommandGroup heading="OPCIÓN #1 · Ejecutar flujo">
                                <CommandItem onSelect={() => addFunctionEjecutarFlujo(step.id)}>
                                    Seleccionar flujo
                                </CommandItem>
                            </CommandGroup>

                            <CommandSeparator />

                            <CommandGroup heading="OPCIÓN #2 · Consulta de datos">
                                <CommandItem onSelect={() => addFunctionConsultaDatos(step.id)}>
                                    Consultar datos del cliente
                                </CommandItem>
                            </CommandGroup>

                            <CommandSeparator />

                            <CommandGroup heading="OPCIÓN #3 · Captura de datos">
                                {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => (
                                    <CommandItem key={opt} onSelect={() => addFunctionCaptura(step.id, opt)}>
                                        {/* <CommandItem onSelect={() => addFunctionCaptura(step.id)}> */}
                                        {opt}
                                        {/* Capturar parámetros/data del usuario */}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            <CommandSeparator />

                            <CommandGroup heading="OPCIÓN #4 · Notificar asesor">
                                <CommandItem onSelect={() => addFunctionNotificar(step.id)}>
                                    Usar número de notificación del perfil
                                </CommandItem>
                            </CommandGroup>

                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>


            <Button onClick={() => addText(step.id)} variant={"outline"}>
                Agregar regla
            </Button>
        </>

    )
}