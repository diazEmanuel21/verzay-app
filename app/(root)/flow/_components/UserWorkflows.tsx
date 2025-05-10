import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, InboxIcon } from 'lucide-react';

import { getWorkFlowforUser } from '@/actions/workflow-actions';
import { Workflow } from '@prisma/client';
import CreateWorflowDialog from './CreateWorflowDialog';
import { WorkflowCard } from '.';

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data;
};

interface UserWorkflowsProps {
    userId: string;
}

export async function UserWorkflows({ userId }: UserWorkflowsProps) {
    const resWorkflow = await getWorkFlowforUser(userId);
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : [];

    if (!workflows) {
        return (
            <Alert variant={'destructive'}>
                <AlertCircle className='w-4 h-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Algo salió mal. Por favor intenta más tarde</AlertDescription>
            </Alert>
        );
    }

    if (workflows.length === 0) {
        return (
            <div className="flex flex-col gap-4 h-full items-center justify-center">
                <div className='rounded-full bg-accent w-20 h-20 flex items-center justify-center'>
                    <InboxIcon size={40} className='stroke-primary' />
                </div>
                <div className='flex flex-col gap-1 text-center'>
                    <p className="font-bold">NO EXISTE NINGUN FLUJO</p>
                    <p className="text-sm text-muted-foreground">Click en botón para crear un nuevo Flujo</p>
                </div>
                <CreateWorflowDialog triggerText="CREA TU PRIMER FLUJO" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-1">
            <div className="grid grid-cols-1 gap-2">
                {workflows.map((workflow) => (
                    <WorkflowCard key={workflow.id} workflow={workflow} userId={userId} />
                ))}
            </div>
        </div>
    );
}