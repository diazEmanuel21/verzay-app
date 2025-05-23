'use server'

import { currentUser } from '@/lib/auth';
import { ConnectionMain } from './_components';
import { redirect } from "next/navigation";
import { Instancias } from "@prisma/client";
import { getInstancesByUserId } from "@/actions/instances-actions";


function hasInstancia(result: { data?: Instancias | null }): result is { data: Instancias } {
    return !!result.data
};

const ConnectionPage = async () => {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    const resInstancia = await getInstancesByUserId(user.id);
    const instance = resInstancia.success && hasInstancia(resInstancia) ? resInstancia.data : undefined;

    return <ConnectionMain user={user} instance={instance} />
}

export default ConnectionPage