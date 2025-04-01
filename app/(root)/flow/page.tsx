import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/shared/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, InboxIcon } from 'lucide-react';
import CreateWorflowDialog from './_components/CreateWorflowDialog';
import WorkflowCard from './_components/WorkflowCard';
import { GetWorkFlowforUser } from '@/actions/getWorkFlowforUser-action';
import { currentUser } from '@/lib/auth';

const FlowPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  };

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
          <UserWorkflows userId={user.id} />
        </Suspense>
      </div>
    </>
  );
};

function UserWorkFlowSkeleton() {
  return (
    <div className='space-y-2'>
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className='h-32 w-full' />
      ))}
    </div>
  );
}

interface UserWorkflowsProps {
  userId: string;
}

async function UserWorkflows({ userId }: UserWorkflowsProps) {
  const workflows = await GetWorkFlowforUser(userId);

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
    <div className="grid grid-cols-1 gap-4">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}

export default FlowPage;