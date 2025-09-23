'use client'

import { useState } from "react"
import { createInstance, } from "@/actions/api-action"
import { toast } from "sonner"
import { ClientInstanceCard, ConnectionCard } from './';
import { ConnectionMainInterface, FormInstanceConnectionValues } from "@/schema/connection";
import { PromptAiFormValues } from "@/schema/ai";

export const ConnectionMain = ({ user, instance, instanceInfo, instanceType }: ConnectionMainInterface) => {
    const [loading, setLoading] = useState<boolean>(false);
    const instanceName = !instance ? '' : instance.instanceName;
    const currentInstanceInfo = instanceInfo?.find(i => i.name === instanceName);

    const onSubmit = async (data: FormInstanceConnectionValues) => {
        setLoading(true);

        if (instance) {
            const msg = "El usuario ya tiene una instancia activa.";
            toast.error(msg);
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("instanceName", data.instanceName);
        formData.append("userId", user.id);

        try {
            const result = await createInstance(formData);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }

        } catch (error) {
            const errorMsg = "Hubo un error al procesar la solicitud.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {
                instance
                    ?
                    <ClientInstanceCard
                        
                        intanceName={instanceName}
                        instanceType={instanceType ?? ''}
                        user={user}
                        currentInstanceInfo={currentInstanceInfo}
                    />
                    :
                    <ConnectionCard
                        userId={user.id}
                        handleSubmit={onSubmit}
                        loading={loading}
                        defaultValues={{ instanceName: instanceName }}
                    />
            }
        </>
    );
};