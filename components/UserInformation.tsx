"use client";

import { useState, useEffect } from "react";
import Header from '@/components/shared/header';
import { PencilIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { obtenerDatosCliente, editarDatosCliente } from "@/actions/userClientDataActions";

interface Client {
    apiUrl: string;
    company: string;
    notificationNumber: string;
    lat: string;
    lng: string;
    openingPhrase: string;
    mapsUrl: string;
}

export const UserInformation = ({ userId }: { userId: string }) => {
    console.log(`user ID ${userId}`);

    const [client, setClient] = useState<Client>({
        apiUrl: "",
        company: "",
        notificationNumber: "",
        lat: "",
        lng: "",
        openingPhrase: "",
        mapsUrl: "",
    });

    const [editableField, setEditableField] = useState<string | null>(null);
    const [showApiUrl, setShowApiUrl] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // 🔸 Cargar datos al iniciar
    useEffect(() => {
        const cargarDatosCliente = async () => {
            const result = await obtenerDatosCliente(userId);
            console.log(result);
            console.log(`data result ${result}`);


            if (!result.success || !result.data) {
                toast.error(result.message);
                return;
            }

            const data = result.data; // Ahora TypeScript sabe que `data` existe

            setClient({
                apiUrl: data.apiUrl || "",
                company: data.company || "",
                notificationNumber: data.notificationNumber || "",
                lat: data.lat || "",
                lng: data.lng || "",
                openingPhrase: data.openingPhrase || "",
                mapsUrl: data.mapsUrl || "",
            });
        };

        if (userId) {
            cargarDatosCliente();
        }
    }, [userId]);

    // 🔸 Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setClient((prev) => ({ ...prev, [name]: value }));
    };

    const handleMapsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setClient((prev) => ({ ...prev, mapsUrl: url }));

        // Extraer latitud y longitud desde la URL
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = url.match(regex);

        if (match) {
            const lat = match[1];
            const lng = match[2];

            setClient((prev) => ({
                ...prev,
                lat,
                lng,
            }));

            toast.success("Coordenadas actualizadas", {
                description: `Lat: ${lat}, Lng: ${lng}`,
                duration: 3000,
            });
        } else {
            toast.error("No se pudieron extraer las coordenadas de la URL");
        }
    };

    const toggleEdit = (field: string) => {
        setEditableField(field === editableField ? null : field);
    };

    // 🔸 Guardar cambios
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación rápida antes de enviar
        const newErrors: { [key: string]: string } = {};
        ["apiUrl", "company", "notificationNumber", "openingPhrase", "mapsUrl"].forEach((key) => {
            if (!client[key as keyof Client]) {
                newErrors[key] = "Este campo es obligatorio.";
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Completa los campos obligatorios.");
            return;
        }

        const result = await editarDatosCliente(userId, {
            apiUrl: client.apiUrl,
            company: client.company,
            notificationNumber: client.notificationNumber,
            lat: client.lat,
            lng: client.lng,
            openingPhrase: client.openingPhrase,
            mapsUrl: client.mapsUrl,
        });

        if (!result.success) {
            toast.error(result.message);
            return;
        }

        toast.success("Datos del cliente actualizados correctamente");
        setEditableField(null);
    };

    const getLabel = (key: string) => {
        const labels: { [key: string]: string } = {
            apiUrl: "API URL",
            company: "Empresa",
            notificationNumber: "Número de Notificación",
            openingPhrase: "Frase de Bienvenida",
        };
        return labels[key] || key;
    };

    return (
        <form onSubmit={handleSubmit} className="px-12">
            <div className="space-y-12">
                <div className="border-b border-gray-300 dark:border-gray-700 pb-6">
                    <Header
                        title={"Perfil de la Empresa"}
                        subtitle={"Esta información se utilizará para la configuración de su agente."}
                    />

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Campos Generales */}
                        {["apiUrl", "company", "notificationNumber", "openingPhrase"].map((key) => (
                            <div key={key} className="relative">
                                <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {getLabel(key)}
                                </label>
                                <div className="mt-2 flex items-center">
                                    <input
                                        id={key}
                                        name={key}
                                        type={key === "apiUrl" && !showApiUrl ? "password" : "text"}
                                        value={client[key as keyof Client]}
                                        onChange={handleChange}
                                        readOnly={editableField !== key}
                                        className={`block w-full rounded-md px-3 py-2 text-gray-900 dark:text-white outline-1 outline-gray-300 dark:outline-gray-600 focus:ring-2 focus:ring-indigo-500 sm:text-sm 
                  ${editableField === key
                                                ? "border-2 border-indigo-500 bg-gray-100 dark:bg-gray-800"
                                                : "bg-white dark:bg-gray-900"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleEdit(key)}
                                        className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    {key === "apiUrl" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowApiUrl(!showApiUrl)}
                                            className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        >
                                            {showApiUrl ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                                {errors[key] && <p className="mt-1 text-sm text-red-600">{errors[key]}</p>}
                            </div>
                        ))}

                        {/* Input URL de Google Maps */}
                        <div className="relative md:col-span-2">
                            <label htmlFor="mapsUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                URL de Google Maps
                            </label>
                            <div className="mt-2 flex items-center">
                                <input
                                    id="mapsUrl"
                                    name="mapsUrl"
                                    type="text"
                                    placeholder="Pega aquí la URL de Google Maps"
                                    value={client.mapsUrl}
                                    onChange={handleMapsUrlChange}
                                    readOnly={editableField !== "mapsUrl"}
                                    className={`block w-full rounded-md px-3 py-2 text-gray-900 dark:text-white outline-1 outline-gray-300 dark:outline-gray-600 focus:ring-2 focus:ring-indigo-500 sm:text-sm 
                ${editableField === "mapsUrl"
                                            ? "border-2 border-indigo-500 bg-gray-100 dark:bg-gray-800"
                                            : "bg-white dark:bg-gray-900"
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleEdit("mapsUrl")}
                                    className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                            {errors["mapsUrl"] && <p className="mt-1 text-sm text-red-600">{errors["mapsUrl"]}</p>}
                        </div>

                        {/* Latitud y Longitud SOLO LECTURA */}
                        {["lat", "lng"].map((coord) => (
                            <div key={coord}>
                                <label htmlFor={coord} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {coord === "lat" ? "Latitud" : "Longitud"}
                                </label>
                                <input
                                    id={coord}
                                    name={coord}
                                    type="text"
                                    value={client[coord as keyof Client]}
                                    readOnly
                                    placeholder={coord === "lat" ? "Ej: 9.9355165" : "Ej: -84.091532"}
                                    className="mt-2 block w-full rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white outline-1 outline-gray-300 dark:outline-gray-600 focus:ring-2 focus:ring-indigo-500 sm:text-sm cursor-not-allowed"
                                />
                                {errors[coord] && <p className="mt-1 text-sm text-red-600">{errors[coord]}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Vista previa del mapa */}
                    <div className="mt-10">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vista previa de ubicación</h3>
                        {client.lat && client.lng ? (
                            <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden shadow-sm">
                                <iframe
                                    src={`https://www.google.com/maps?q=${client.lat},${client.lng}&output=embed`}
                                    width="100%"
                                    height="300"
                                    loading="lazy"
                                    className="w-full h-72"
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ingresa latitud y longitud válidas para ver la ubicación.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="mt-6 flex items-center justify-end gap-x-4">
                <button
                    type="submit"
                    className="rounded-md bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md focus:ring-2 focus:ring-indigo-500"
                >
                    Guardar
                </button>
            </div>
        </form>

    );
}