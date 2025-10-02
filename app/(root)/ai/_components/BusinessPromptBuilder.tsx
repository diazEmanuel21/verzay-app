"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { BusinessBuilderInterface } from "@/types/agentAi";

export const BusinessPromptBuilder = ({ values, handleChange }: BusinessBuilderInterface) => {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Información del Negocio</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Form */}
                <Card className="border-muted/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Información del Negocio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="Nombre del Negocio*"
                                placeholder="Ej. Holi Print RD"
                                value={values.nombre}
                                onChange={handleChange("nombre")}
                                required
                            />
                            <Field
                                label="Sector / Rubro"
                                placeholder="Ej. Stickers y etiquetas"
                                value={values.sector}
                                onChange={handleChange("sector")}
                            />
                            <Field
                                label="Ubicación / Dirección"
                                placeholder="Ej. Av. Siempre Viva 742, Quito"
                                value={values.ubicacion}
                                onChange={handleChange("ubicacion")}
                            />
                            <Field
                                label="Horarios de Atención"
                                placeholder="Ej. Lun–Sáb 9:00 a 18:00"
                                value={values.horarios}
                                onChange={handleChange("horarios")}
                            />
                            <Field
                                label="URL Google Maps"
                                placeholder="https://maps.google.com/..."
                                value={values.maps}
                                onChange={handleChange("maps")}
                                type="url"
                            />
                            <Field
                                label="Número de Contacto"
                                placeholder="Ej. +57 300 123 4567"
                                value={values.telefono}
                                onChange={handleChange("telefono")}
                            />
                            <Field
                                label="Correo electrónico"
                                placeholder="ventas@negocio.com"
                                value={values.email}
                                onChange={handleChange("email")}
                                type="email"
                            />
                            <Field
                                label="Sitio web"
                                placeholder="https://negocio.com"
                                value={values.sitio}
                                onChange={handleChange("sitio")}
                                type="url"
                            />
                            <Field
                                label="URL Facebook"
                                placeholder="https://facebook.com/tu-negocio"
                                value={values.facebook}
                                onChange={handleChange("facebook")}
                                type="url"
                            />
                            <Field
                                label="URL Instagram"
                                placeholder="https://instagram.com/tu_negocio"
                                value={values.instagram}
                                onChange={handleChange("instagram")}
                                type="url"
                            />
                            <Field
                                label="URL TikTok"
                                placeholder="https://tiktok.com/@tu_negocio"
                                value={values.tiktok}
                                onChange={handleChange("tiktok")}
                                type="url"
                            />
                            <Field
                                label="URL YouTube"
                                placeholder="https://youtube.com/@tu_negocio"
                                value={values.youtube}
                                onChange={handleChange("youtube")}
                                type="url"
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="notas">Notas / Instrucciones extra (opcional)</Label>
                            <Textarea
                                id="notas"
                                placeholder="Agrega aclaraciones que quieras inyectar al prompt (tono, restricciones, etc.)"
                                className="min-h-[96px]"
                                value={values.notas}
                                onChange={handleChange("notas")}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* --------------------------- Small Field wrapper --------------------------- */
function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
}: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    const id = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Input id={id} value={value} onChange={onChange} placeholder={placeholder} type={type} />
        </div>
    );
}