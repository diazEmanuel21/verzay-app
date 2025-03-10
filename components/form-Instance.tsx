'use client'; // Esto habilita el componente para usar hooks como useState y manejar eventos en el lado del cliente

import { createInstance, verificarInstanciaActiva, eliminarInstancia } from "@/actions/api-action"; // Asegúrate de tener la función eliminarInstancia disponible
import { useEffect, useState } from "react";

export default function FormInstance({ userId }: { userId: string }) {
  const [instanceName, setInstanceName] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [instanceExists, setInstanceExists] = useState<boolean>(false);

  // Efecto para verificar si ya existe una instancia activa al cargar el componente
  useEffect(() => {
    const checkInstance = async () => {
      const activeInstance = await verificarInstanciaActiva(userId);
      setInstanceExists(!!activeInstance); // Actualiza el estado si ya existe una instancia
      setInstanceName(activeInstance?.instanceName || "");
    };

    checkInstance();
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    // No enviar el formulario si la instancia ya existe
    if (instanceExists) {
      setMessage("El usuario ya tiene una instancia activa.");
      setLoading(false);
      return;
    }

    // Crear los datos del formulario para enviarlos
    const formData = new FormData();
    formData.append("instanceName", instanceName);
    formData.append("userId", userId);

    try {
      // Llama a la función createInstance directamente
      const result = await createInstance(formData);
      setMessage(result.message);

      // Si la instancia se crea con éxito, actualiza el estado de `instanceExists`
      if (result.success) {
        setInstanceName("");
        setInstanceExists(true); // Marca que la instancia ya existe

        // Recargar la página después de crear la instancia
        window.location.reload();
      }
    } catch (error) {
      setMessage("Hubo un error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar la instancia
  const handleDelete = async () => {
    setLoading(true);
    setMessage(null); // Limpia mensajes anteriores

    try {
      const result = await eliminarInstancia(userId); // Asegúrate de que la función eliminarInstancia esté implementada
      setMessage(result.message);

      if (result.success) {
        setInstanceExists(false); // Actualiza el estado para indicar que la instancia ha sido eliminada
      }
    } catch (error) {
      setMessage("Hubo un error al procesar la solicitud de eliminación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {instanceExists ? (
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">
            Instancia Creada: <br />
            <span className="text-gray-800">{instanceName}</span>
          </h1>
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`mt-4 w-6 h-6 rounded-full text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
            } transition duration-200 flex items-center justify-center`}
            title="Eliminar Instancia"
          >
            {loading ? (
              <span className="loader" /> // Icono de carga
            ) : (
              <span className="text-white text-base">&times;</span> // Símbolo de eliminación
            )}
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Crear conexion</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="instanceName"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre de la Instancia:
              </label>
              <input
                type="text"
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                required
                className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-1 px-3 rounded-md text-white font-semibold ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              } transition duration-200`}
            >
              {loading ? "Creando..." : "Crear Instancia"}
            </button>
          </form>
        </>
      )}
      {message && (
        <p
          className={`mt-4 text-sm ${
            message.startsWith("El usuario") ? "text-red-500" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
  
}
