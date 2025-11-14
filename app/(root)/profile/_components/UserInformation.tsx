'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Header from '@/components/shared/header';
import { toast } from "sonner";
import { getClientDataByUserId, updateClientDataByField, updateAbrirPhrase } from "@/actions/userClientDataActions";
import { optimizeFile } from "../../flow/[workflowId]/helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from 'zod';
import { Camera /*, ExternalLinkIcon*/ } from "lucide-react";
import { UserWithPausar } from "@/lib/types";
import { BrandSelector } from "../../../../components/custom";
import { useResellerStore } from "@/stores/resellers/resellerStore";
import { Role } from "@prisma/client";
import { ApiKeyConfigurator } from "./";
import { UserInformationProps } from "../page";
import { ConnectionMain } from "../../connection/_components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-select";

// ============================
// Tipado
// ============================
type EditableFields = {
    apiUrl: string;
    company: string;
    notificationNumber: string;
    del_seguimiento: string;
    lat: string;
    lng: string;
    mapsUrl: string;
    autoReactivate: number;
    delayTimeGPT: number;
    // Excluyendo campos no editables:
    // id, createdAt, updatedAt, pausar, etc.
};

// ============================
// Esquema de validación con Zod
// ============================
const clientSchema = z.object({
    apiUrl: z.string().min(10).max(200),
    company: z.string().max(50).min(3, { message: 'La empresa debe tener al menos 3 caracteres' }),
    notificationNumber: z.string().min(7).max(15),
    del_seguimiento: z.string().min(3).max(45),
    lat: z.string().optional(),
    lng: z.string().optional(),
    mapsUrl: z.string().url({ message: 'La URL de Google Maps no es válida' }),
    openMsg: z.string().min(3).max(45),
    autoReactivate: z.string(),
    delayTimeGPT: z.string(),
});

const defaultImgUrl = 'https://images.pexels.com/photos/133356/pexels-photo-133356.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

// ============================
// Componente Principal
// ============================
export const UserInformation = ({ userId, countries, instancesData }: UserInformationProps) => {
    const reseller = useResellerStore((state) => state.reseller);

    /* Se extiende el user para poder utilizar openMsg from Pausar cómo un field nativo del User */
    const [user, setUser] = useState<(UserWithPausar & { openMsg?: string })>();
    const [originalUser, setOriginalUser] = useState<(UserWithPausar & { openMsg?: string })>();
    // const [saveMapsUrl, setSaveMapsUrl] = useState(false); // ⬅️ MAPS DESACTIVADO
    const [loadingField, setLoadingField] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);

    // ============================
    // Cargar datos de cliente
    // ============================
    const fetchClientData = useCallback(async () => {
        if (!userId) return toast.error("El usuario no existe.");

        try {
            const result = await getClientDataByUserId(userId);
            if (!result) return;
            if (!result.success || !result.data)
                return toast.error(result.message || "Error al cargar los datos.");
            if (Object.keys(result.data).length === 0)
                return toast.error("No se encontraron datos asociados al usuario.");

            const data = result.data;
            const openMsg = data.pausar.find((p) => p.tipo === "abrir")?.mensaje || "";
            setUser({ ...data, openMsg });
            setOriginalUser({ ...data, openMsg });
        } catch (error) {
            toast.error("Error al obtener data." + error);
        }
    }, [userId]);

    useEffect(() => {
        fetchClientData();
    }, [userId]);

    // ============================
    // Guardar campo en onBlur
    // ============================
    const handleBlur = async (field: keyof (UserWithPausar & { openMsg?: string }), valueFied?: string) => {
        if (!user || !originalUser) return; // protección extra

        const newValue = user[field];
        const currentValue = originalUser[field];

        if (newValue === currentValue) return;
        /* Valida que la URL tenga el formato deseado */
        // if (field === 'mapsUrl' && !saveMapsUrl) return; // ⬅️ MAPS DESACTIVADO

        try {
            let result;
            const fieldSchema = clientSchema.shape[field as keyof typeof clientSchema.shape];
            fieldSchema.parse(newValue);

            setLoadingField(field);
            toast.loading(`Guardando ${field}...`, { id: field });

            const fieldValue = (field === 'lat' || field === 'lng')
                ? valueFied ?? ''
                : String(newValue ?? '');

            /* Ejecuta una función para actualizar dependiendo del campo.*/
            if (field === 'openMsg') {
                result = await updateAbrirPhrase(userId, fieldValue);
            } else {
                result = await updateClientDataByField(userId, field, fieldValue);
            };

            if (!result.success) {
                toast.error(result.message || `Error al guardar.`, { id: field });
            } else {
                setOriginalUser(prev => {
                    if (!prev) return prev;
                    return { ...prev, [field]: newValue };
                });

                toast.success(`Actualizado con éxito!`, { id: field });
            }
        } catch (error: any) {
            const message = error?.errors?.[0]?.message || 'Error de validación';
            toast.error(message, { id: field });
        } finally {
            setLoadingField(null);
        }
    };

    // ============================
    // Cambiar valor de un campo
    //  Como openMsg no es parte real de la tabla, lo debemos actualizar localmente:
    // ============================
    const handleChange = (field: keyof (UserWithPausar & { openMsg?: string }), value: string) => {
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    // ============================
    // Extraer lat/lng de Google Maps (DESACTIVADO)
    // ============================
    /*
    const handleMapsUrlChange = (value: string) => {
        setSaveMapsUrl(false);
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, mapsUrl: value };
        });

        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = value.match(regex);

        if (!match) {
            return toast.error(
                <div className="flex flex-col gap-1">
                    <p className="font-medium">URL de Google Maps no válida</p>
                    <p className="text-sm">Para obtener la URL correcta:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                        <li>Busca tu negocio en Google Maps</li>
                        <li>Copia la URL de tu barra de navegación</li>
                        <li>Pega esa URL completa aquí</li>
                    </ol>
                    <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-blue-600 hover:underline font-medium"
                    >
                        <ExternalLinkIcon className="w-4 h-4 mr-1" />
                        Abrir Google Maps
                    </a>
                </div>,
                {
                    duration: 10000, // 10 segundos
                }
            );
        };
        setSaveMapsUrl(true);

        const lat = match[1];
        const lng = match[2];

        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, lat: lat, lng: lng };
        });

        saveCoordenates('lat', lat);
        saveCoordenates('lng', lng);
    };
    */

    // ============================
    // Guardar coordenadas (DESACTIVADO)
    // ============================
    /*
    const saveCoordenates = async (field: keyof UserWithPausar, valueFied?: string) => {
        try {
            setLoadingField(field);
            toast.loading(`Guardando ${field}...`, { id: field });

            const result = await updateClientDataByField(userId, field, valueFied || '');

            if (!result.success) {
                toast.error(result.message || `Error al guardar.`, { id: field });
            } else {
                toast.success(`Coordenadas actualizadas con éxito!`, { id: field });
            }

            setLoadingField(null);
        } catch (error: any) {
            const message = error?.errors?.[0]?.message || 'Error de validación';
            toast.error(message, { id: field });
        }
    };
    */

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) {
            toast.error('No hay archivo seleccionado');
            return;
        }

        const toastId = toast.loading('Subiendo avatar...');
        setLoadingField('image');

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
            formData.append('workflowID', userId); // usamos el userId como workflowId para que no tengas que modificar backend

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            const { url } = await res.json();

            const result = await updateClientDataByField(userId, 'image', url);
            if (!result.success) throw new Error(result.message);

            setUser(prev => prev ? { ...prev, image: url } : prev);
            toast.success('Avatar actualizado', { id: toastId });

        } catch (error: any) {
            toast.error(error?.message || 'Error al subir el avatar', { id: toastId });
        } finally {
            setLoadingField(null);
        }
    };

    return (
        <>
            {user && (
                <div className="flex flex-col gap-6">
                    {/* Barra superior: título + avatar */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <Header title="Ajustes de perfil" />

                        <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 shadow-sm">
                            <button
                                type="button"
                                className="relative w-14 h-14 rounded-full overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary transition"
                                onClick={() => fileRef.current?.click()}
                            >
                                <img
                                    src={(user?.image as string) ?? defaultImgUrl}
                                    alt="avatar-preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                    <Camera className="text-white h-4 w-4" />
                                </div>
                            </button>

                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">
                                    {user.name ?? "Tu perfil"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Haz clic en la foto para actualizar tu avatar.
                                </p>
                            </div>
                        </div>

                        <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            ref={fileRef}
                            onChange={(e) => handleImageUpload(e)}
                            className="hidden"
                        />
                    </div>

                    {/* Contenido principal */}
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Preferencias del agente</CardTitle>
                                <CardDescription>
                                    Configura notificaciones, tiempos de respuesta y frases
                                    automáticas.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* API Key */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label className="text-sm">API key OpenAI</Label>
                                        <span className="text-[11px] text-muted-foreground">
                                            Gestiona la conexión con tu proveedor de IA.
                                        </span>
                                    </div>
                                    <ApiKeyConfigurator
                                        userId={userId}
                                        onSaved={() => {
                                            // si deseas refrescar la tarjeta del usuario u otros datos:
                                            // fetchClientData();
                                        }}
                                    />
                                </div>

                                <Separator />

                                {/* Campos de texto / números */}
                                {[
                                    {
                                        key: "notificationNumber",
                                        label: "Número de notificación",
                                        placeholder: "Ej: 573233246305",
                                    },
                                    {
                                        key: "autoReactivate",
                                        label: "Tiempo de reactivación (minutos)",
                                        type: "number",
                                        placeholder: "Ej: 300",
                                    },
                                    {
                                        key: "delayTimeGPT",
                                        label: "Tiempo de retraso GPT (segundos)",
                                        type: "number",
                                        placeholder: "Ej: 12",
                                    },
                                    {
                                        key: "openMsg",
                                        label: "Frase de reactivación",
                                        placeholder: "Ej: Fue un gusto ayudarle.",
                                    },
                                    {
                                        key: "del_seguimiento",
                                        label: "Eliminar seguimiento",
                                        placeholder: "Texto que se enviará al cerrar el seguimiento.",
                                    },
                                ].map(({ key, label, type, placeholder }) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label htmlFor={key} className="text-sm">
                                            {label}
                                        </Label>
                                        <Input
                                            id={key}
                                            name={key}
                                            type={type || "text"}
                                            placeholder={placeholder}
                                            value={user[key as keyof EditableFields] as string}
                                            disabled={loadingField === key}
                                            onChange={(e) =>
                                                handleChange(
                                                    key as keyof UserWithPausar,
                                                    e.target.value
                                                )
                                            }
                                            onBlur={() => handleBlur(key as keyof UserWithPausar)}
                                            className="bg-background border-border h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Conexión de WhatsApp</CardTitle>
                                <CardDescription>
                                    Administra la instancia conectada y el estado del bot.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center items-center w-full">
                                <ConnectionMain
                                    user={user}
                                    instance={instancesData["Whatsapp"].instance}
                                    instanceInfo={instancesData["Whatsapp"].info}
                                    instanceType={"Whatsapp"}
                                    prompts={instancesData["Whatsapp"].prompts}
                                />

                                {/* Selector de color (solo reseller) */}
                                {user.role === Role.reseller && (
                                    <div className="pt-2 border-t">
                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                            Tema visual del panel
                                        </Label>
                                        <BrandSelector />
                                    </div>
                                )}

                                {/* Selector de módulos (si lo vuelves a activar) */}
                                {/* {user.role === Role.reseller && (
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Módulos activos
                  </Label>
                  <ModulesSelector />
                </div>
              )} */}
                            </CardContent>
                        </Card>

                    </div>
                </div>
            )}
        </>
    );
};
