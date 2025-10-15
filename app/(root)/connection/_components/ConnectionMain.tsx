'use client';

import { useState, useMemo } from 'react';
import { createInstance } from '@/actions/api-action';
import { toast } from 'sonner';
import { ClientInstanceCard, ConnectionCard } from './';
import { ConnectionMainInterface, FormInstanceConnectionValues } from '@/schema/connection';
import { PromptInstance } from '@prisma/client';

export const ConnectionMain = ({
  user,
  instance,
  instanceInfo,
  instanceType,
  prompts,
}: ConnectionMainInterface) => {
  const [loading, setLoading] = useState<boolean>(false);
  const instanceName = !instance ? '' : instance.instanceName;
  const currentInstanceInfo = instanceInfo?.find((i) => i.name === instanceName);

  // 🚀 [LOG] Datos iniciales
  console.log('[ConnectionMain] Mount →', {
    userId: user.id,
    instance,
    instanceType,
    promptsCount: prompts?.length ?? 0,
  });

  // Memoiza prompts para evitar recrear arrays en cada render
  const filteredPrompts: PromptInstance[] = useMemo(() => {
    const filtered = prompts ? prompts.filter((p) => p.instanceType === instanceType) : [];
    console.log('[ConnectionMain] Filtrando prompts →', {
      instanceType: instanceType,
      encontrados: filtered.length,
    });
    return filtered;
  }, [prompts, instanceType]);

  const onSubmit = async (data: FormInstanceConnectionValues) => {
    console.log('[ConnectionMain] onSubmit → datos recibidos', data);
    setLoading(true);

    if (instance) {
      console.warn('[ConnectionMain] Instancia ya existente, cancelando creación.');
      toast.error('El usuario ya tiene una instancia activa.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('instanceName', data.instanceName);
    formData.append('instanceType', data.instanceType);
    formData.append('userId', user.id);

    // 🔍 [LOG] Verificando datos antes del envío
    console.log('[ConnectionMain] Enviando FormData →', {
      instanceName: data.instanceName,
      instanceType: data.instanceType,
      userId: user.id,
    });

    try {
      const result = await createInstance(formData);
      console.log('[ConnectionMain] Resultado de createInstance →', result);

      if (result.success) {
        console.log('[ConnectionMain] ✅ Instancia creada con éxito.');
        toast.success(result.message);
      } else {
        console.warn('[ConnectionMain] ❌ Error al crear instancia →', result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[ConnectionMain] ⚠️ Excepción atrapada →', error);
      toast.error('Hubo un error al procesar la solicitud.');
    } finally {
      setLoading(false);
      console.log('[ConnectionMain] Estado finalizado (loading = false)');
    }
  };

  // 🔄 [LOG] Render dinámico según estado
  console.log('[ConnectionMain] Render →', {
    tieneInstancia: !!instance,
    instanceName,
    instanceType,
    loading,
  });

  return instance ? (
    <ClientInstanceCard
      intanceName={instanceName}
      instanceType={instanceType}
      user={user}
      currentInstanceInfo={currentInstanceInfo}
      prompts={filteredPrompts}
    />
  ) : (
    <ConnectionCard
      user={user}
      handleSubmit={onSubmit}
      loading={loading}
      defaultValues={{ instanceName, instanceType: instanceType }}
      instanceType={instanceType}
    />
  );
};
