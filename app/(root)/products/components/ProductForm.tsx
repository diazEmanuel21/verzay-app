// components/products/ProductForm.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    ProductFormInterface,
    productSchema,
    type ProductInput,
} from "@/lib/validators/product";

import { createProduct, updateProduct } from "@/actions/products-actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { Pencil, Plus, Loader2 } from "lucide-react";

export const ProductForm = ({
    userId,
    product,
    variant = "button",
}: ProductFormInterface) => {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<ProductInput>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            id: product?.id,
            title: product?.title ?? "",
            description: product?.description ?? "",
            price: (product?.price as any) ?? 0,
            sku: product?.sku ?? "",
            stock: product?.stock ?? 0,
            isActive: product?.isActive ?? true,
            images: (product?.images ?? []) as string[],
            userId,
        },
    });

    // 🔧 Resetear valores cada vez que se abre el modal,
    // diferenciando entre crear (sin product) y editar (con product)
    useEffect(() => {
        if (!open) return;

        form.reset({
            id: product?.id,
            title: product?.title ?? "",
            description: product?.description ?? "",
            price: (product?.price as any) ?? 0,
            sku: product?.sku ?? "",
            stock: product?.stock ?? 0,
            isActive: product?.isActive ?? true,
            images: (product?.images ?? []) as string[],
            userId,
        });
    }, [open, product, userId, form]);

    const onSubmit = form.handleSubmit((values) => {
        startTransition(async () => {
            if (values.id) {
                await updateProduct(values.id, values);
            } else {
                await createProduct(values);
            }
            setOpen(false);
        });
    });

    const Trigger =
        variant === "icon" ? (
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(true)}
            >
                <Pencil className="h-4 w-4" />
            </Button>
        ) : (
            <Button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2"
            >
                <Plus className="h-4 w-4" />
                <span>Nuevo producto</span>
            </Button>
        );

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                // Opcional: si cierras, limpias errores
                if (!nextOpen) {
                    form.clearErrors();
                }
            }}
        >
            <DialogTrigger asChild>{Trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {product?.id ? "Editar producto" : "Nuevo producto"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Label>Título</Label>
                            <Input
                                {...form.register("title")}
                                placeholder="Nombre del producto"
                            />
                        </div>
                        <div>
                            <Label>Precio</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...form.register("price", {
                                    valueAsNumber: true,
                                })}
                            />
                        </div>
                        <div>
                            <Label>SKU</Label>
                            <Input
                                {...form.register("sku")}
                                placeholder="SKU opcional"
                            />
                        </div>
                        <div>
                            <Label>Stock</Label>
                            <Input
                                type="number"
                                {...form.register("stock", {
                                    valueAsNumber: true,
                                })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={form.watch("isActive")}
                                onCheckedChange={(v) =>
                                    form.setValue("isActive", v)
                                }
                            />
                            <Label>Activo</Label>
                        </div>
                        <div className="col-span-2">
                            <Label>Descripción</Label>
                            <Textarea
                                rows={4}
                                {...form.register("description")}
                                placeholder="Detalles, características…"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {product?.id ? "Guardar cambios" : "Guardar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};