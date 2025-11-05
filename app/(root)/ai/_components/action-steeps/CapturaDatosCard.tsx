// components/training/cards/CapturaDatosCard.tsx
"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PedidoFieldsEditor } from "../"; // ajusta la ruta según tu barrel/index
import { PropsDataCapture } from "@/types/agentAi";

// shadcn/ui Select
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const SUBTYPE_OPTIONS = ["Pedidos", "Solicitudes", "Reclamos", "Reservas"] as const;
type DataSubtype = (typeof SUBTYPE_OPTIONS)[number];

type CapturaDatosCardProps = PropsDataCapture & {
    /** Opcional: si lo pasas, actualiza el subtipo en el padre */
    onSubtypeChange?: (subtype: DataSubtype, elId: string) => void;
};

export const CapturaDatosCard: FC<CapturaDatosCardProps> = ({
    el,
    onRemove,
    onAddField,
    onRemoveField,
    onSubtypeChange,
}) => {
    const isPedidos = el.subtype === "Pedidos";

    return (
        <Card className="bg-muted/20 border-muted/60">
            <CardHeader className="py-3 flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">Formularios · Captura de datos</CardTitle>

                    {/* Selector de subtipo */}
                    <Select
                        value={el.subtype as DataSubtype}
                        onValueChange={(v) => onSubtypeChange?.(v as DataSubtype, el.id)}
                    >
                        <SelectTrigger className="h-8 w-[148px] text-xs">
                            <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUBTYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs">
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="ghost" size="icon" onClick={onRemove}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="p-0 m-0">
                {/* Si alguna vez quieres mostrar el prompt fijo:
        <div className="space-y-1 px-4 py-2">
          <label className="text-xs font-medium">Prompt agregado:</label>
          <Textarea value={el.prompt} readOnly className="min-h-[64px]" />
        </div> */}

                {isPedidos && (
                    <div className="px-4 pb-3">
                        <PedidoFieldsEditor
                            stepId={(el as any).stepId ?? ""} // si no lo tienes, puedes omitir
                            elId={el.id}
                            element={el}
                            onAdd={onAddField}
                            onRemove={onRemoveField}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
