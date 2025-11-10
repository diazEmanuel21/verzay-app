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

export interface CaptureFunctionIF {
    stepId: string
    subtype?: "Solicitudes" | "Reclamos" | "Pedidos" | "Reservas" | null
}

export const FunctionSelector = ({ step, setSteps, notificationNumber, isManagement = false }: FunctionSelectorInterface) => {
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

    const addFunctionCaptura = ({ stepId, subtype }: CaptureFunctionIF) => {
        const tempSubtype = subtype ?? 'Pedidos';

        setSteps((prev) =>
            prev.map((s) => {
                if (s.id !== stepId) return s;
                const base: ElementFunction = {
                    id: nanoid(),
                    kind: "function",
                    fn: "captura_datos",
                    subtype: tempSubtype,
                    prompt: CAPTURE_SNIPPETS[tempSubtype],
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

                            <CommandGroup heading="Acciónes">
                                {!isManagement &&
                                    <CommandItem onSelect={() => addFunctionEjecutarFlujo(step.id)}>
                                        Ejecutar flujo
                                    </CommandItem>
                                }
                                {/* {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => ( */}
                                {isManagement && <>
                                    <CommandItem onSelect={() => addFunctionCaptura({ stepId: step.id })}>
                                        {/* {opt} */}
                                        Captura de datos
                                    </CommandItem>
                                    {/* ))} */}
                                    <CommandItem onSelect={() => addFunctionConsultaDatos(step.id)}>
                                        Consulta de datos
                                    </CommandItem>
                                    <CommandItem >
                                        Actualizar datos
                                    </CommandItem>
                                </>}
                                {!isManagement &&
                                    <CommandItem onSelect={() => addFunctionNotificar(step.id)}>
                                        Notificar asesor
                                    </CommandItem>
                                }
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover >


            <Button onClick={() => addText(step.id)} variant={"outline"}>
                Agregar regla
            </Button>
        </>

    )
}