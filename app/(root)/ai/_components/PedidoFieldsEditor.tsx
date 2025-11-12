import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PedidoFunctionEl } from "@/types/agentAi";
import { useState } from "react";
import { PlusIcon, SaveIcon } from 'lucide-react';


/* ----------------- Editor de campos para "Pedidos" ----------------- */
export const PedidoFieldsEditor = ({
    stepId,
    elId,
    element,
    onAdd,
    onRemove,
}: {
    stepId: string;
    elId: string;
    element: PedidoFunctionEl;
    onAdd: (field: string) => void;
    onRemove: (field: string) => void;
}) => {
    const [input, setInput] = useState("");

    const add = () => {
        onAdd(input);
        setInput("");
    };

    return (
        <div className="space-y-2 pb-3">
            <label className="text-xs font-medium">Campos/datos:</label>
            <div className="flex gap-2">
                <Input
                    placeholder="Ej.: cc, name, direccion…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                />
                <Button type="button" variant="secondary" onClick={add}>
                    <SaveIcon/>
                    {/* Guardar campo */}
                </Button>
            </div>

            {element.fields && element.fields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {element.fields.map((f) => (
                        <Badge key={f} variant="outline" className="gap-1">
                            {f}
                            <button
                                type="button"
                                aria-label={`Eliminar ${f}`}
                                className="ml-1 opacity-70 hover:opacity-100"
                                onClick={() => onRemove(f)}
                            >
                                ×
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">Aún no hay campos agregados.</p>
            )}
        </div>
    );
}