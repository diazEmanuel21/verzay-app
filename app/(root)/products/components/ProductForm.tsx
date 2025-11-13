'use client'

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    ProductFormInterface,
    productSchema,
    type ProductInput,
} from "@/lib/validators/product";

import { createProduct, updateProduct, checkIfSkuExists } from "@/actions/products-actions"; // Asegúrate de importar la nueva acción para verificar SKU
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
import { toast } from "sonner"; // Asegúrate de tener el toast importado para mostrar los mensajes
import { optimizeFile } from "../../flow/[workflowId]/helpers";

export const ProductForm = ({
    userId,
    product,
    variant = "button",
}: ProductFormInterface) => {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSkuDuplicate, setIsSkuDuplicate] = useState(false); // Estado para manejar el error de SKU duplicado
    const [imagePreview, setImagePreview] = useState<string | null>(null); // Para mostrar la vista previa de la imagen subida

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
            category: product?.category ?? "",  // Se añade para la categoría
            tags: product?.tags ?? [],  // Se añaden etiquetas
        },
    });

    // Verificación del SKU cuando se ingresa o modifica el campo SKU
    useEffect(() => {
        const checkSku = async (sku: string | null | undefined) => {
            if (sku && sku.trim() !== "") {  // Asegúrate de que el SKU no sea vacío ni nulo
                const isDuplicate = await checkIfSkuExists(sku, userId);
                setIsSkuDuplicate(isDuplicate);
            } else {
                setIsSkuDuplicate(false);  // Si el SKU es nulo o vacío, lo tratamos como no duplicado
            }
        };

        checkSku(form.watch("sku"));  // Usamos el valor de SKU directamente
    }, [form.watch("sku"), userId]);

    // Resetear valores del formulario cuando se abre el modal
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
            category: product?.category ?? "",
            tags: product?.tags ?? [],
        });
    }, [open, product, userId, form]);

    // Función para manejar la carga de imágenes
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) {
            toast.error('No hay archivo seleccionado');
            return;
        }

        const toastId = toast.loading('Subiendo imagen...');
        try {
            const content = await file.arrayBuffer();

            const plainFile = {
                name: file.name,
                size: file.size,
                type: file.type,
                content: Array.from(new Uint8Array(content))
            };

            // Si tienes optimización (por ejemplo con sharp en backend o alguna lib en frontend)
            const optimizedFile = await optimizeFile(plainFile); // 👈 debes tener esta función en tu proyecto
            const optimizedBuffer = new Uint8Array(optimizedFile.buffer);
            const blob = new Blob([optimizedBuffer], { type: optimizedFile.type });

            const formData = new FormData();
            formData.append('file', blob); // usamos el blob optimizado
            formData.append('userID', userId);

            const res = await fetch('/api/upload-products', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            const { url } = await res.json();

            // Actualizamos la imagen en el formulario
            form.setValue("images", [url]);
            setImagePreview(url);

            toast.success('Imagen cargada', { id: toastId });

        } catch (error: any) {
            toast.error(error?.message || 'Error al subir la imagen', { id: toastId });
        }
    };

    const onSubmit = form.handleSubmit(async (values) => {
        startTransition(async () => {
            try {
                if (values.id) {
                    await updateProduct(values.id, values);
                } else {
                    await createProduct(values);
                }
                setOpen(false);
            } catch (error) {
                toast.error("¡Este SKU ya está registrado!");
            }
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
                if (!nextOpen) {
                    form.clearErrors();
                    setIsSkuDuplicate(false); // Limpiamos el estado de SKU duplicado cuando cerramos el modal
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
                    <div className="flex gap-2 flex-col">
                        <div className="col-span-2">
                            <Label>Nombre</Label>
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
                        {/* <div>
                            <Label>SKU</Label>
                            <Input
                                {...form.register("sku")}
                                placeholder="SKU opcional"
                            />
                            {isSkuDuplicate && (
                                <p className="text-red-500 text-sm">
                                    Este SKU ya está registrado
                                </p>
                            )}
                        </div> */}
                        <div>
                            <Label>Categoría</Label>
                            <Input
                                {...form.register("category")}
                                placeholder="Categoría del producto"
                            />
                        </div>
                        {/* <div>
                            <Label>Etiquetas</Label>
                            <select
                                multiple
                                {...form.register("tags")}
                                className="w-full p-2 border"
                            >
                                {["Electrónica", "Ropa", "Alimentos", "Muebles"].map(tag => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                            </select>
                        </div> */}
                        <div>
                            <Label>Imagen</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            {imagePreview && <img src={imagePreview} alt="Vista previa" className="mt-2 w-32" />}
                        </div>
                        <div>
                            <Label>Detalles</Label>
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
