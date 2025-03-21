import React, { Suspense } from 'react'

import Header from '@/components/shared/header';
import { Skeleton } from '@/components/ui/skeleton';
import { waitFor } from '@/lib/waitFor';
import { GetWorkFlowforUser } from '@/actions/getWorkFlowforUser-action';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, InboxIcon } from 'lucide-react';
import CreateWorflowDialog from './_components/CreateWorflowDialog';
import WorkflowCard from './_components/WorkflowCard';

const flowPage = async () => {
    const session = await currentUser();
    const user = await db.user.findUnique({
        where: { email: session?.email ?? "" }
    });
    if (!user) {
        return <div>Not authenticated</div>;
    }
    return (
        <>
            <div>
                <div className="flex justify-between">
                    <Header
                        title={'Flujos'}
                        subtitle={'Crea tus Flujos de manera mas organizada'}
                    />
                    <CreateWorflowDialog />
                </div>
            </div>

            <div className='h-full py-6'>
                <Suspense fallback={<UserWorkFlowSkeleton />}>
                    <UserWorkflows />
                </Suspense>

            </div>

        </>
    )
}


function UserWorkFlowSkeleton() {
    return <div className='space-y-2' >
        {
            [1, 2, 3, 4].map(i => <Skeleton key={i} className='h-32 w-full' />)
        }
    </div>
}

async function UserWorkflows() {

    const session = await currentUser();

    const user = await db.user.findUnique({
        where: { email: session?.email ?? "" }
    });

    const workflows = await GetWorkFlowforUser(user?.id);

    if (!workflows) {
        return (
            <Alert variant={'destructive'} >
                <AlertCircle className='w-4 h-4'></AlertCircle>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Algo salio mal. Por favor intenta mas tarde</AlertDescription>
            </Alert>
        );
    }

    if (workflows.length === 0) {
        return <div className="flex flex-col gap-4 h-full items-center justify-center">
            <div className='rounded-full bg-accent w-20 h-20 flex items-center justify-center'>
                <InboxIcon size={40} className='stroke-primary'></InboxIcon>
            </div>
            <div className='flex flex-col gap-1 text-center'>
                <p className="font-bold">NO EXISTE NINGUN FLUJO</p>
                <p className="text-sm text-muted-foreground">Click en boton para crear un nuevo Flujo</p>
            </div>
            <CreateWorflowDialog triggerText="CREA TU PRIMER FLUJO"></CreateWorflowDialog>
        </div>
    }

    return <div className="grid grid-cols-1 gap-4">
        {workflows.map((workflows) => (
            <WorkflowCard key={workflows.id} workflow={workflows} />
        ))}
    </div>
}
export default flowPage
