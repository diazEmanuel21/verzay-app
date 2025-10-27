"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useProductsAutosave } from "./hooks/useProductsAutosave";
import { ProductBuilderProps, ProductItem, ProductItemDTO } from "@/types/agentAi";
import { FunctionSelectorInline } from "./helpers";

export function ProductBuilder({
    values,
    handleChange,
    onChange,
    promptId,
    version,
    onVersionChange,
    onConflict,
    initialItems = [],
    flows = [], // 👈 lista de flujos disponibles desde BD
    notificationNumber
}: ProductBuilderProps) {
    const [items, setItems] = useState<ProductItemDTO[]>(
        Array.isArray(initialItems) && initialItems.length > 0
            ? initialItems
            : [{ id: nanoid(), name: "", description: "" }]
    );

    // Autosave estructurado
    useProductsAutosave({
        promptId,
        version,
        items,
        onVersionChange,
        onConflict: (serverState) => {
            const serverItems = serverState?.sections?.products?.items ?? [];
            setItems(serverItems);
            onConflict?.(serverState);
        },
    });

    // Construcción del bloque tipo prompt (Markdown)
    const prompt = useMemo(() => {
        const blocks = (items as ProductItemDTO[])
            .filter((p) => (p.name ?? "").trim() || (p.description ?? "").trim())
            .map((p) =>
                [
                    `### Producto: ${(p.name ?? "").trim() || "(Sin nombre)"}`,
                    `* **Descripción:**`,
                    (p.description ?? "").trim() || "(Sin descripción)",
                ].join("\n")
            );
        return blocks.join("\n\n---\n\n");
    }, [items]);

    // Sincroniza con el padre
    useEffect(() => {
        onChange?.({ items: items as ProductItem[], prompt });
        if (values.products !== prompt) {
            const setProducts = handleChange("products");
            setProducts({
                target: { value: prompt },
            } as React.ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, items, values.products]);

    // Mutadores locales
    const updateName = (id: string, v: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: v } : it)));

    // 🔧 Inserta texto adicional al final de la descripción
    const appendToDescription = (id: string, text: string) => {
        setItems((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        description: (p.description ? p.description.trim() + "\n" : "") + text,
                    }
                    : p
            )
        );
    };

    const updateDesc = (id: string, v: string) =>
        setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, description: v } : it))
        );

    const addProduct = () =>
        setItems((prev) => [...prev, { id: nanoid(), name: "", description: "" }]);

    const removeProduct = (id: string) =>
        setItems((prev) => prev.filter((it) => it.id !== id));

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Registro de productos</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {items.map((it) => (
                    <div key={it.id} className="rounded-md border p-3 border-muted/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Nombre</label>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Eliminar producto"
                                onClick={() => removeProduct(it.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <Input
                            placeholder="Ej. Camiseta básica unisex"
                            value={it.name ?? ""}
                            onChange={(e) => updateName(it.id, e.target.value)}
                        />

                        <label className="text-sm font-medium mt-2">Descripción</label>
                        <Textarea
                            placeholder="Breve descripción del producto, materiales, tallas, colores, etc."
                            className="min-h-[32px]"
                            value={it.description ?? ""}
                            onChange={(e) => updateDesc(it.id, e.target.value)}
                        />

                        <div className="flex w-full flex-col">
                            <FunctionSelectorInline
                                flows={flows}
                                notificationNumber={notificationNumber}
                                onInsert={(text) => appendToDescription(it.id, text)}
                            />
                        </div>
                    </div>
                ))}

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={addProduct}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" /> Agregar producto
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
