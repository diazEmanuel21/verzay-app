"use client";

import { useState, useEffect } from "react";
import Header from '@/components/shared/header';
import { PencilIcon, MapPinIcon, ArrowTopRightOnSquareIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

interface Client {
  apiUrl: string;
  company: string;
  notificationNumber: string;
  lat: string;
  lng: string;
  openingPhrase: string;
}

const initialClient: Client = {
  apiUrl: "https://chatgpt.com",
  company: "Metrowireless",
  notificationNumber: "+50686969986",
  lat: "-34.9072876",
  lng: "-56.1985678",
  openingPhrase: "Fue un placer ayudarle.",
};

const ProfilePage = () => {
  const [client, setClient] = useState<Client>(initialClient);
  const [editableField, setEditableField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showApiUrl, setShowApiUrl] = useState(false);

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: parseFloat(initialClient.lat),
    lng: parseFloat(initialClient.lng),
  });

  useEffect(() => {
    const lat = parseFloat(client.lat);
    const lng = parseFloat(client.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ lat, lng });
    }
  }, [client.lat, client.lng]);

  const toggleEdit = (field: string) => {
    setEditableField(editableField === field ? null : field);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!client.apiUrl) {
      newErrors.apiUrl = "La URL de la API es obligatoria.";
    } else if (!/^https?:\/\/\S+$/i.test(client.apiUrl)) {
      newErrors.apiUrl = "Debe ser una URL válida.";
    }

    if (!client.company || client.company.length < 3) {
      newErrors.company = "Debe ingresar un nombre de empresa válido (mínimo 3 caracteres).";
    }

    if (!client.notificationNumber) {
      newErrors.notificationNumber = "Debe ingresar un número de notificación.";
    } else if (!/^\+\d{8,15}$/.test(client.notificationNumber)) {
      newErrors.notificationNumber = "Debe ser un número en formato internacional. Ejemplo: +50686969986.";
    }

    if (!client.lat || !client.lng) {
      newErrors.latlng = "Debe ingresar coordenadas válidas.";
    } else {
      const lat = parseFloat(client.lat);
      const lng = parseFloat(client.lng);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.lat = "Latitud inválida (-90 a 90).";
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.lng = "Longitud inválida (-180 a 180).";
      }
    }

    if (!client.openingPhrase || client.openingPhrase.length < 5) {
      newErrors.openingPhrase = "Debe ingresar una frase válida (mínimo 5 caracteres).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    toast.success("¡Guardado correctamente!", {
      description: "La configuración del cliente fue actualizada exitosamente.",
      duration: 3000,
    });
    console.log("Datos del cliente:", client);
  };

  const handleCancel = () => {
    setClient(initialClient);
    setErrors({});
    setEditableField(null);
    setShowApiUrl(false);

    toast("Cambios descartados", {
      description: "Se han restablecido los valores originales.",
      duration: 3000,
    });
  };

  return (
    <>
      {/* <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md"> */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto rounded-lg ">
       
            <div className="space-y-12">
            <div className="border-b border-gray-300 pb-6">
            <Header
              title={'Perfil de la Empresa'}
              subtitle={'Esta información se utilizará para la configuración de su agente.'}
            />
            {/* <h2 className="text-lg font-semibold text-gray-900">Perfil de la Empresa</h2>
            <p className="mt-1 text-sm text-gray-600">Esta información se utilizará para la configuración de su agente.</p> */}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campos Generales */}
              {["apiUrl", "company", "notificationNumber", "openingPhrase"].map((key) => (
                <div key={key} className="relative">
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700">
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
                      className={`block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:ring-2 focus:ring-indigo-500 sm:text-sm ${editableField === key ? "border-2 border-indigo-500 bg-gray-100" : ""
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleEdit(key)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    {key === "apiUrl" && (
                      <button
                        type="button"
                        onClick={() => setShowApiUrl(!showApiUrl)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        {showApiUrl ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  {errors[key] && <p className="mt-1 text-sm text-red-600">{errors[key]}</p>}
                </div>
              ))}

              {/* Latitud y Longitud */}
              {["lat", "lng"].map((coord) => (
                <div key={coord}>
                  <label htmlFor={coord} className="block text-sm font-medium text-gray-700">
                    {coord === "lat" ? "Latitud" : "Longitud"}
                  </label>
                  <input
                    id={coord}
                    name={coord}
                    type="text"
                    value={client[coord as keyof Client]}
                    onChange={handleChange}
                    placeholder={coord === "lat" ? "Ej: 9.9355165" : "Ej: -84.091532"}
                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors[coord] && <p className="mt-1 text-sm text-red-600">{errors[coord]}</p>}
                </div>
              ))}
            </div>

            {/* Vista previa del mapa */}
            <div className="mt-10">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa de ubicación</h3>
              {coordinates.lat && coordinates.lng ? (
                <div className="border rounded-md overflow-hidden shadow-sm">
                  <iframe
                    src={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&output=embed`}
                    width="100%"
                    height="300"
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Ingresa latitud y longitud válidas para ver la ubicación.</p>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex items-center justify-end gap-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-semibold text-gray-900 hover:text-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
            Guardar
          </button>
        </div>
      </form>
    </>
  );
};

export default ProfilePage;

const getLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    apiUrl: "URL de la API",
    company: "Empresa",
    notificationNumber: "Número de Notificaciones",
    openingPhrase: "Frase de Cierre",
  };
  return labels[key] || key;
};
