import { db } from '@/lib/db';
import React from 'react'
import { GetNodeforUser } from '@/actions/getNodeforUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NodeCard } from './_components/NodeCard';
import { CreateNodeComponent } from './_components/CrateNodeComponent';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InboxIcon } from 'lucide-react';

const CustomWorkflow = async ({ params }: { params: { workflowId: string } }) => {
  const user = await currentUser();
  if (!user) {
    redirect('/login');
  };

  const { workflowId } = params;

  const nodes = await GetNodeforUser(workflowId);

  const workflow = await db.workflow.findUnique({
    where: {
      id: workflowId,
      userId: user?.id,
    }
  })

  if (!workflow) {
    return <div>Workflow not found</div>
  }

  return (
    <div className='flex flex-col items-center min-h-full'>
      {/* <div className='flex justify-end w-full'>
        <CreateNodeComponent workflowId={workflowId} plan={user?.plan} />
      </div> */}

      {nodes.length > 0 ? (
        <div className='flex flex-col h-full w-full gap-5 px-4 text-center pt-6' >
          {nodes.map((nodes) => (
            <NodeCard key={nodes.id} nodes={nodes} workflowId={workflow.id} user={user} />
          ))}
          <div className='flex items-center justify-center'>
            <CreateNodeComponent workflowId={workflowId} plan={user?.plan} />
          </div>
        </div>

      ) : (
        <div className="flex flex-1 flex-col gap-4 h-full items-center justify-center">
          <div className='rounded-full bg-accent w-20 h-20 flex items-center justify-center'>
            <InboxIcon size={40} className='stroke-primary' />
          </div>
          <div className='flex flex-col gap-1 text-center'>
            <p className="font-bold">No tienes ningun nodo creado</p>
            <p className="text-sm text-muted-foreground">Crea un nuevo nodo ahora mismo!</p>
          </div>
          <CreateNodeComponent workflowId={workflowId} plan={user?.plan} />
        </div>
      )}
    </div>
  );
}

export default CustomWorkflow
