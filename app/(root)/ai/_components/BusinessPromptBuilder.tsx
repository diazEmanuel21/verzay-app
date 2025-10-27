"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import {
    BusinessPromptBuilderProps,
    FormValues,
    promptSchema,
} from "@/types/agentAi";
import { useBusinessAutosave } from "./hooks/useBusinessAutosave";

/* ---------- CAMPOS ADICIONALES DISPONIBLES ---------- */
const optionalFields = [
    { value: "email", label: "Correo electrónico" },
    { value: "sitio", label: "Sitio web" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "youtube", label: "YouTube" },
    { value: "notas", label: "Notas" },
];

export const BusinessPromptBuilder = ({
    values,
    handleChange,
    user,
    promptId,
    version,
    onVersionChange,
    onConflict,
}: BusinessPromptBuilderProps) => {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(promptSchema),
        defaultValues: {
            nombre: user?.company ?? values.nombre ?? "",
            sector: values.sector ?? "",
            ubicacion: values.ubicacion ?? "",
            horarios: values.horarios ?? "",
            maps: user?.mapsUrl ?? values.maps ?? "",
            telefono: values.telefono ?? values.telefono ?? "",
            email: values.email ?? "",
            sitio: values.sitio ?? "",
            facebook: values.facebook ?? "",
            instagram: values.instagram ?? "",
            tiktok: values.tiktok ?? "",
            youtube: values.youtube ?? "",
            notas: values.notas ?? "",
        },
        mode: "onChange",
    });

    // 🔁 AUTOSAVE
    useBusinessAutosave({
        form,
        promptId,
        version,
        onVersionChange,
        onConflict,
    });

    const toggleField = (field: string) => {
        setSelectedFields((prev) =>
            prev.includes(field)
                ? prev.filter((f) => f !== field)
                : [...prev, field]
        );
    };

    return (
        <div className="gap-2 flex flex-col">
            <Card className="border-muted/60">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Información del Negocio
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Form {...form}>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            {/* Campos Principales */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Nombre */}
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nombre del Negocio
                                                <span className="text-destructive"> *</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Holi Print RD"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleChange?.("nombre")(e);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Sector */}
                                <FormField
                                    control={form.control}
                                    name="sector"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sector / Rubro</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Stickers y etiquetas"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleChange?.("sector")(e);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Ubicación */}
                                <FormField
                                    control={form.control}
                                    name="ubicacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ubicación / Dirección</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Av. Siempre Viva 742, Quito"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleChange?.("ubicacion")(e);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Horarios */}
                                <FormField
                                    control={form.control}
                                    name="horarios"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horarios de Atención</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Lun–Sáb 9:00 a 18:00"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleChange?.("horarios")(e);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Teléfono */}
                                <FormField
                                    control={form.control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Contacto</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. +57 300 123 4567"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleChange?.("telefono")(e);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Campos dinámicos */}
                                {selectedFields.includes("email") && (
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Correo electrónico</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="ventas@negocio.com"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("email")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedFields.includes("sitio") && (
                                    <FormField
                                        control={form.control}
                                        name="sitio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sitio web</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://negocio.com"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("sitio")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedFields.includes("facebook") && (
                                    <FormField
                                        control={form.control}
                                        name="facebook"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Facebook</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://facebook.com/tu-negocio"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("facebook")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedFields.includes("instagram") && (
                                    <FormField
                                        control={form.control}
                                        name="instagram"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Instagram</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://instagram.com/tu_negocio"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("instagram")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedFields.includes("tiktok") && (
                                    <FormField
                                        control={form.control}
                                        name="tiktok"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>TikTok</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://tiktok.com/@tu_negocio"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("tiktok")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedFields.includes("youtube") && (
                                    <FormField
                                        control={form.control}
                                        name="youtube"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>YouTube</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://youtube.com/@tu_negocio"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("youtube")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            {/* Notas */}
                            {selectedFields.includes("notas") && (
                                <>
                                    <Separator />
                                    <FormField
                                        control={form.control}
                                        name="notas"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notas / Instrucciones extra</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className="min-h-[64px]"
                                                        placeholder="Aclaraciones, tono, restricciones..."
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleChange?.("notas")(e);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            <Separator />

                            {/* 🔽 Selector de Campos Adicionales */}
                            <div className="flex flex-col gap-2">
                                <FormLabel>Campos adicionales</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="justify-between"
                                        >
                                            {selectedFields.length > 0
                                                ? `${selectedFields.length} seleccionados`
                                                : "Seleccionar campos..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[280px]">
                                        <Command>
                                            <CommandInput placeholder="Buscar campo..." />
                                            <CommandList>
                                                <CommandGroup>
                                                    {optionalFields.map((field) => (
                                                        <CommandItem
                                                            key={field.value}
                                                            onSelect={() => toggleField(field.value)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedFields.includes(field.value)
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {field.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};
