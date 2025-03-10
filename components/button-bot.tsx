'use client';
import React, { useEffect, useState } from 'react';
import { getInstances } from '@/actions/api-action';

interface EnableToggleButtonProps {
  userId: string;
}

const EnableToggleButton: React.FC<EnableToggleButtonProps> = ({ userId }) => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null); // Cambiar el estado inicial a null
  const [loading, setLoading] = useState<boolean>(true); // Estado de carga inicial
  const [error, setError] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<{ instanceName: string; instanceId: string } | null>(null);

  const baseUrl = 'https://conexion-1.verzay.co';

  // Función para cargar instancias y obtener el estado del webhook
  const loadInstanceData = async () => {
    try {
      const instances = await getInstances(userId);
      if (instances && instances.length > 0) {
        const { instanceName, instanceId } = instances[0];
        setInstanceData({ instanceName, instanceId });
        await fetchWebhookStatus(instanceName, instanceId);
      } else {
        setError('No se encontraron instancias para este usuario.');
      }
    } catch (err) {
      setError(`Error al cargar las instancias: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false); // Finaliza la carga aquí
    }
  };

  // Función para verificar el estado actual del webhook
  const fetchWebhookStatus = async (instanceName: string, instanceId: string) => {
    try {
      const response = await fetch(`${baseUrl}/webhook/find/${instanceName}`, {
        method: 'GET',
        headers: { apikey: instanceId },
      });
  
      if (!response.ok) throw new Error('Error al obtener el estado del webhook.');
  
      const data = await response.json();
      
      // Verificar si la respuesta es null y manejar el estado
      if (data === null) {
        setIsEnabled(false); // Establecer como 'Apagado' cuando la respuesta es null
      } else {
        setIsEnabled(data.enabled);
      }
    } catch (err) {
      setError(`Error al obtener el estado del webhook: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Función para alternar el estado de habilitación
  const toggleEnable = async () => {
    if (!instanceData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/webhook/set/${instanceData.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: instanceData.instanceId,
        },
        body: JSON.stringify({
          webhook: {
            enabled: !isEnabled,
            url: 'https://auto.aizenbots.com/webhook',
            byEvents: true,
            base64: true,
            events: ['MESSAGES_UPSERT'],
          },
        }),
      });

      if (!response.ok) throw new Error('Error al cambiar el estado de habilitación.');
      setIsEnabled((prev) => !prev);
    } catch (err) {
      setError(`Error al cambiar el estado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar instancias y API Key al montar el componente
  useEffect(() => {
    loadInstanceData();
  }, [userId]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button
        onClick={toggleEnable}
        className={`px-4 py-2 rounded-md text-white ${isEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}`}
        disabled={loading || !instanceData}
      >
        {loading ? 'Cargando...' : isEnabled !== null ? (isEnabled ? 'Encendido' : 'Apagado') : 'Cargando...'} {/* Manejo de estado null */}
      </button>
    </div>
  );
};

export default EnableToggleButton;
