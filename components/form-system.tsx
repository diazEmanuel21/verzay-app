"use client"; // Esto habilita el componente para usar hooks como useState y manejar eventos en el lado del cliente

import { agregarMensaje, obtenerMensajes, editarMensaje, eliminarMensaje } from "@/actions/api-action"; // Asegúrate de que las funciones estén disponibles
import { useEffect, useState } from "react";

export default function FormSystemMessage({ userId }: { userId: string }) {
  const [message, setMessage] = useState<string>(""); // Mensaje del sistema
  const [responseMessage, setResponseMessage] = useState<string | null>(null); // Mensaje de respuesta del servidor
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]); // Lista de mensajes
  const [editingId, setEditingId] = useState<string | null>(null); // ID del mensaje que se está editando

  // Efecto para cargar los mensajes al iniciar
  useEffect(() => {
    const loadMessages = async () => {
      const userMessages = await obtenerMensajes(userId);
      setMessages(userMessages);
    };

    loadMessages();
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResponseMessage(null); // Resetear el mensaje de respuesta

    const formData = new FormData();
    formData.append("message", message);
    formData.append("userId", userId);

    try {
      let result;

      // Si estamos editando un mensaje
      if (editingId) {
        formData.append("id", editingId); // Agrega el ID para la edición
        result = await editarMensaje(formData); // Llama a la función de edición
      } else {
        result = await agregarMensaje(formData); // Llama a la función para agregar mensaje
      }

      setResponseMessage(result.message); // Mostrar el mensaje de respuesta del servidor

      // Limpiar el campo del mensaje si la operación fue exitosa
      if (result.success) {
        setMessage("");
        setEditingId(null); // Reiniciar el ID de edición
        // Recargar los mensajes después de agregar o editar
        const userMessages = await obtenerMensajes(userId);
        setMessages(userMessages);
      }
    } catch (error) {
      setResponseMessage("Hubo un error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (msg: any) => {
    setMessage(msg.message); // Establece el mensaje en el campo de texto
    setEditingId(msg.id); // Guarda el ID del mensaje que se está editando
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este mensaje?")) {
      try {
        const result = await eliminarMensaje(id); // Llama a la función de eliminación
        setResponseMessage(result.message); // Mostrar el mensaje de respuesta

        // Recargar los mensajes después de eliminar
        const userMessages = await obtenerMensajes(userId);
        setMessages(userMessages);
      } catch (error) {
        setResponseMessage("Hubo un error al procesar la solicitud.");
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Entrena tu IA para que sea tu mejor aliado</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Mensaje:
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } transition duration-200`}
        >
          {loading ? "Guardando..." : editingId ? "Actualizar Mensaje" : "Agregar Mensaje"}
        </button>
      </form>
      {responseMessage && (
        <p className={`mt-4 text-sm ${responseMessage.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
          {responseMessage}
        </p>
      )}
      
      {/* Listado de mensajes del sistema */}
      <h3 className="text-lg font-semibold mt-6">Funciones del Robot:</h3>
      <ul className="mt-4">
        {messages.map((msg) => (
          <li key={msg.id} className="flex justify-between items-center p-2 border-b">
            <span>{msg.message}</span>
            <div>
              <button
                onClick={() => handleEdit(msg)}
                className="text-blue-600 hover:underline mx-2"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(msg.id)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
