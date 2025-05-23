'use client'

import { useState } from "react"
import { createInstance, deleteInstance, generateQRCode } from "@/actions/api-action"
import { toast } from "sonner"
import { Instancias, User } from '@prisma/client';
import { ClientInstanceCard, ConnectionCard } from './';
import { FormInstanceConnectionValues } from "@/schema/connection";

export const ConnectionMain = ({ user, instance }: { user: User, instance?: Instancias }) => {
    const [loading, setLoading] = useState<boolean>(false);

    const instanceName = !instance ? '' : instance.instanceName

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
                        intanceName={'Dasilrod Multitienda'}
                        user={user}
                        intanceNumber={'584129109044'}
                        messages={21610}
                        contacts={2444}
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
    )
}
