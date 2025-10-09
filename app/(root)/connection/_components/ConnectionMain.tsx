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

    // Memoiza prompts para evitar recrear arrays en cada render
    const filteredPrompts: PromptInstance[] = useMemo(() => {
        return prompts ? prompts.filter((p) => p.instanceType === instanceType) : [];
    }, [prompts, instanceType]);

    const onSubmit = async (data: FormInstanceConnectionValues) => {
        setLoading(true);

        if (instance) {
            toast.error('El usuario ya tiene una instancia activa.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('instanceName', data.instanceName);
        formData.append('tipoInstancia', data.instanceType);
        formData.append('userId', user.id);

        try {
            const result = await createInstance(formData);
            result.success ? toast.success(result.message) : toast.error(result.message);
        } catch (error) {
            toast.error('Hubo un error al procesar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return instance ? (
        <ClientInstanceCard
            intanceName={instanceName}
            instanceType={instanceType ?? ''}
            user={user}
            currentInstanceInfo={currentInstanceInfo}
            prompts={filteredPrompts}
        />
    ) : (
        <ConnectionCard
            user={user}
            handleSubmit={onSubmit}
            loading={loading}
            defaultValues={{ instanceName, instanceType }}
            instanceType={instanceType}
        />
    );
};
