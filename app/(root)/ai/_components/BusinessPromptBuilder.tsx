"use client";

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

import { BusinessPromptBuilderProps, FormValues, promptSchema } from "@/types/agentAi";
import { useBusinessAutosave } from "./hooks/useBusinessAutosave";

export const BusinessPromptBuilder = ({ values,
    handleChange,
    user,
    promptId,
    version,
    onVersionChange,
    onConflict }: BusinessPromptBuilderProps) => {
    // Flags de bloqueo por datos del user
    const isCompanyLocked = Boolean(user?.company);
    const isMapsLocked = Boolean(user?.mapsUrl);
    const isPhoneLocked = Boolean(user?.notificationNumber);

    const form = useForm<FormValues>({
        resolver: zodResolver(promptSchema),
        defaultValues: {
            nombre: user?.company ?? values.nombre ?? '',
            sector: values.sector ?? '',
            ubicacion: values.ubicacion ?? '',
            horarios: values.horarios ?? '',
            maps: user?.mapsUrl ?? values.maps ?? '',
            telefono: user?.notificationNumber ?? values.telefono ?? '',
            email: values.email ?? '',
            sitio: values.sitio ?? '',
            facebook: values.facebook ?? '',
            instagram: values.instagram ?? '',
            tiktok: values.tiktok ?? '',
            youtube: values.youtube ?? '',
            notas: values.notas ?? '',
        },
        mode: 'onChange',
    });

    // 🔁 AUTOSAVE con debounce y control de versionado
    useBusinessAutosave({
        form,
        promptId,
        version,
        onVersionChange,
        onConflict,
    });

//TODO:  CREAR  FUNCIONALIDAD PARA QUE LOS FIELDS COMENTADOS APAREZCAN O SE OCULTEN MEDIANTE UN SELECTOR COMBOBOX

    return (
        <div className="gap-2 flex flex-col">
            <Card className="border-muted/60">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Información del Negocio</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Form {...form}>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Nombre del negocio */}
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nombre del Negocio<span className="text-destructive"> *</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Holi Print RD"
                                                    {...field}
                                                    // disabled={isCompanyLocked}
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

                                {/* Maps URL */}
                                {/* <FormField
                                    control={form.control}
                                    name="maps"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL Google Maps</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="url"
                                                    placeholder="https://maps.google.com/..."
                                                    {...field}
                                                    // disabled={isMapsLocked}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleChange?.("maps")(e);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                /> */}

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
                                                    // disabled={isPhoneLocked}
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

                                {/* Email */}
                                {/* <FormField
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
                                /> */}

                                {/* Sitio web */}
                                {/* <FormField
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
                                /> */}

                                {/* Facebook */}
                                {/* <FormField
                                    control={form.control}
                                    name="facebook"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL Facebook</FormLabel>
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
                                /> */}

                                {/* Instagram */}
                                {/* <FormField
                                    control={form.control}
                                    name="instagram"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL Instagram</FormLabel>
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
                                /> */}

                                {/* TikTok */}
                                {/* <FormField
                                    control={form.control}
                                    name="tiktok"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL TikTok</FormLabel>
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
                                /> */}

                                {/* YouTube */}
                                {/* <FormField
                                    control={form.control}
                                    name="youtube"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL YouTube</FormLabel>
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
                                /> */}
                            </div>

                            <Separator />

                            {/* Notas */}
                            {/* <FormField
                                control={form.control}
                                name="notas"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="notas">Notas / Instrucciones extra (opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                id="notas"
                                                className="min-h-[96px]"
                                                placeholder="Agrega aclaraciones que quieras inyectar al prompt (tono, restricciones, etc.)"
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
                            /> */}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};