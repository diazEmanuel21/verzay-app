// components/training/cards/CapturaDatosCard.tsx
"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PedidoFieldsEditor } from "../"; // ajusta la ruta según tu barrel/index
import { PropsDataCapture } from "@/types/agentAi";

export const CapturaDatosCard: FC<PropsDataCapture> = ({ el, onRemove, onAddField, onRemoveField }) => {
    const isPedidos = el.subtype === "Pedidos";

    return (
        <Card className="bg-muted/20 border-muted/60">
            <CardHeader className="py-3 flex-row items-center justify-between">
                <CardTitle className="text-sm">
                    Formularios · Captura de datos — {el.subtype}
                </CardTitle>
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
                    <div className="px-4">
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