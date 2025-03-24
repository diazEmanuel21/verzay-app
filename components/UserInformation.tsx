'use client';

import { useState, useEffect } from "react";
import Header from '@/components/shared/header';
import { toast } from "sonner";
import { getClientData , updateClientData  } from "@/actions/userClientDataActions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from 'zod';

// ============================
// Esquema de validación con Zod
// ============================
const clientSchema = z.object({
    apiUrl: z.string().url({ message: 'La API URL no es válida' }).min(5),
    company: z.string().min(3, { message: 'La empresa debe tener al menos 3 caracteres' }),
    notificationNumber: z.string().min(7).max(15).regex(/^\d+$/, { message: 'El número debe ser numérico' }),
    lat: z.string().optional(),
    lng: z.string().optional(),
    openingPhrase: z.string().min(3, { message: 'La frase de apertura es muy corta' }),
    mapsUrl: z.string().url({ message: 'La URL de Google Maps no es válida' }),
});

// ============================
// Tipado
// ============================
interface Client {
    apiUrl: string;
    company: string;
    notificationNumber: string;
    lat: string;
    lng: string;
    openingPhrase: string;
    mapsUrl: string;
}

// ============================
// Componente Principal
// ============================
export const UserInformation = ({ userId }: { userId: string }) => {
    const [client, setClient] = useState<Client>(initialClientState());
    const [originalClient, setOriginalClient] = useState<Client>(initialClientState());
    const [loadingField, setLoadingField] = useState<string | null>(null);

    // ============================
    // Cargar datos de cliente
    // ============================
    useEffect(() => {
        if (!userId) return;

        const fetchClientData = async () => {
            const result = await getClientData(userId);

            if (!result.success || !result.data) {
                toast.error(result.message || 'Error al cargar los datos');
                return;
            }

            const data = result.data;
            setClient(data);
            setOriginalClient(data);
        };

        fetchClientData();
    }, [userId]);

    // ============================
    // Guardar campo en onBlur
    // ============================
    const handleBlur = async (field: keyof Client) => {
        const newValue = client[field];
        const currentValue = originalClient[field];

        if (newValue === currentValue) {
            return;
        }

        try {
            const fieldSchema = clientSchema.shape[field];
            fieldSchema.parse(newValue);

            setLoadingField(field);
            toast.loading(`Guardando ${field}...`, { id: field });

            const result = await updateClientData(userId, { ...client });

            if (!result.success) {
                toast.error(result.message || `Error al guardar ${field}`, { id: field });
            } else {
                setOriginalClient(prev => ({ ...prev, [field]: newValue }));
                toast.success(`${field} actualizado`, { id: field });
            }

            setLoadingField(null);
        } catch (error: any) {
            const message = error?.errors?.[0]?.message || 'Error de validación';
            toast.error(message, { id: field });
        }
    };

    // ============================
    // Cambiar valor de un campo
    // ============================
    const handleChange = (field: keyof Client, value: string) => {
        setClient(prev => ({ ...prev, [field]: value }));
    };

    // ============================
    // Extraer lat/lng de Google Maps
    // ============================
    const handleMapsUrlChange = (value: string) => {
        setClient(prev => ({ ...prev, mapsUrl: value }));

        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = value.match(regex);

        if (match) {
            const lat = match[1];
            const lng = match[2];

            setClient(prev => ({ ...prev, lat, lng }));
            toast.success("Coordenadas actualizadas automáticamente");
        }
    };

    return (
        <div className="px-6 md:px-12 py-8">
            <div className="space-y-8">
                <Header
                    title="Perfil de la Empresa"
                    subtitle="Esta información se utilizará para la configuración de su agente."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { key: 'apiUrl', label: 'API URL', type: 'password' },
                        { key: 'company', label: 'Empresa' },
                        { key: 'notificationNumber', label: 'Número de Notificación' },
                        { key: 'openingPhrase', label: 'Frase de Apertura' },
                    ].map(({ key, label, type }) => (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="text-muted-foreground">{label}</Label>
                            <Input
                                id={key}
                                name={key}
                                type={type || 'text'}
                                value={client[key as keyof Client]}
                                disabled={loadingField === key}
                                onChange={(e) => handleChange(key as keyof Client, e.target.value)}
                                onBlur={() => handleBlur(key as keyof Client)}
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
                            value={client.mapsUrl}
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
                                value={client[coord as keyof Client]}
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
                    {client.lat && client.lng ? (
                        <div className="rounded-md overflow-hidden border border-border">
                            <iframe
                                src={`https://www.google.com/maps?q=${client.lat},${client.lng}&output=embed`}
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
    );
};

// ============================
// Estado inicial
// ============================
const initialClientState = (): Client => ({
    apiUrl: "",
    company: "",
    notificationNumber: "",
    lat: "",
    lng: "",
    openingPhrase: "",
    mapsUrl: "",
});