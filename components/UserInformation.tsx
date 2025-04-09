'use client';

import { useState, useEffect, useRef } from "react";
import Header from '@/components/shared/header';
import { toast } from "sonner";
import { getClientDataByUserId, updateClientDataByField, updateAbrirPhrase } from "@/actions/userClientDataActions";
import { optimizeFile } from "../app/(root)/flow/[workflowId]/helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from 'zod';
import { Camera, ExternalLinkIcon } from "lucide-react";
import { UserWithPausar } from "@/lib/types";
import { Button } from "./ui/button";

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
});

const defaultImgUrl = 'https://images.pexels.com/photos/133356/pexels-photo-133356.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

// ============================
// Componente Principal
// ============================
export const UserInformation = ({ userId }: { userId: string }) => {
    /* Se extiende el user para poder utilizar openMsg from Pausar cómo un field nativo del User */
    const [user, setUser] = useState<(UserWithPausar & { openMsg?: string })>();
    const [originalUser, setOriginalUser] = useState<(UserWithPausar & { openMsg?: string })>();
    const [saveMapsUrl, setSaveMapsUrl] = useState(false);
    const [loadingField, setLoadingField] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    // ============================
    // Cargar datos de cliente
    // ============================
    const fetchClientData = async () => {
        if (!userId) return toast.error('El usuario no existe.');

        try {
            const result = await getClientDataByUserId(userId);
            if (!result) return;
            if (!result.success || !result.data) return toast.error(result.message || 'Error al cargar los datos.');
            if (Object.keys(result.data).length === 0) return toast.error('No se encontraron datos asociados al usuario.');

            const data = result.data;
            const openMsg = data.pausar.filter(p => p.tipo === 'abrir')[0]?.mensaje || '';
            setUser({ ...data, openMsg });
            setOriginalUser({ ...data, openMsg });

        } catch (error) {
            toast.error('Error al obtener data.' + error);
        }
    };

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
        if (field === 'mapsUrl' && !saveMapsUrl) return;

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
    // Extraer lat/lng de Google Maps
    // ============================
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

    // ============================
    // Guardar campo en onBlur
    // ============================
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
            {
                user && (
                    <div className="px-6 md:px-12 py-8">
                        <div className="space-y-8">
                            <div className="flex flex-row justify-between">
                                <Header
                                    title="Perfil de la Empresa"
                                    subtitle="Esta información se utilizará para la configuración de su agente."
                                />
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Foto de perfil</Label>

                                    <div className="flex items-center gap-4">
                                        <div
                                            className="relative w-16 h-16 rounded-full overflow-hidden border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            <img
                                                src={user?.image as string ?? defaultImgUrl}
                                                alt="avatar-preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                                <Camera className="text-white h-4 w-4" />
                                            </div>
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {[
                                    { key: 'apiUrl', label: 'API key OpenAI', type: 'password' },
                                    { key: 'company', label: 'Empresa' },
                                    { key: 'notificationNumber', label: 'Número de notificación' },
                                    { key: 'openMsg', label: 'Frase de reactivación' },
                                    { key: 'del_seguimiento', label: 'Eliminar seguimiento' },
                                ].map(({ key, label, type }) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={key} className="text-muted-foreground">{label}</Label>
                                        <Input
                                            id={key}
                                            name={key}
                                            type={type || 'text'}
                                            value={user[key as keyof EditableFields] as string}
                                            disabled={loadingField === key}
                                            onChange={(e) => handleChange(key as keyof UserWithPausar, e.target.value)}
                                            onBlur={() => handleBlur(key as keyof UserWithPausar)}
                                            className="bg-background border border-border focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                    </div>
                                ))}

                                {/* URL Google Maps */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="mapsUrl" className="text-muted-foreground">
                                        URL de Google Maps
                                    </Label>
                                    <Input
                                        id="mapsUrl"
                                        name="mapsUrl"
                                        type="text"
                                        placeholder="Pega aquí la URL de Google Maps"
                                        value={user?.mapsUrl}
                                        disabled={loadingField === 'mapsUrl'}
                                        onChange={(e) => handleMapsUrlChange(e.target.value)}
                                        onBlur={() => handleBlur('mapsUrl')}
                                        className="bg-background border border-border focus-visible:ring-2 focus-visible:ring-primary"
                                    />
                                </div>

                                {/* Latitud y Longitud */}
                                {['lat', 'lng'].map(coord => (
                                    <div key={coord} className="space-y-2">
                                        <Label htmlFor={coord} className="text-muted-foreground">
                                            {coord === 'lat' ? 'Latitud' : 'Longitud'}
                                        </Label>
                                        <Input
                                            id={coord}
                                            name={coord}
                                            type="text"
                                            value={user[coord as keyof EditableFields] as string}
                                            disabled
                                            readOnly
                                            className="bg-muted border border-border text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Vista previa del mapa */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Vista previa de ubicación
                                </h3>
                                {user?.lat && user?.lng ? (
                                    <div className="rounded-md overflow-hidden border border-border">
                                        <iframe
                                            src={`https://www.google.com/maps?q=${user.lat},${user.lng}&output=embed`}
                                            width="100%"
                                            height="300"
                                            loading="lazy"
                                            className="w-full h-72"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Ingresa una URL válida de Google Maps para ver la ubicación.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};
