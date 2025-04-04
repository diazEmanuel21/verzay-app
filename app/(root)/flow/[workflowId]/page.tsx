import { db } from '@/lib/db';
import React from 'react'
import { GetNodeforUser } from '@/actions/getNodeforUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NodeCard } from './_components/NodeCard';
import { CreateNodeComponent } from './_components/CrateNodeComponent';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
    <div className='flex flex-col items-center min-h-screen'>
      <div className='absolute top-3 right-2'>
        <CreateNodeComponent workflowId={workflowId} />
      </div>

      {nodes.length > 0 ? (
        <div className='flex flex-col h-full w-full gap-5 px-4 text-center pt-6' >
          {nodes.map((nodes) => (
            <NodeCard key={nodes.id} nodes={nodes} workflowId={workflow.id} user={user} />
          ))}
          <div className='flex items-center justify-center'>
            <CreateNodeComponent workflowId={workflowId} />
          </div>
        </div>

      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="flex max-w-[300px]">
            <Alert>
              <AlertTitle>No tienes ningun nodo creado</AlertTitle>
              <AlertDescription>Crea un nuevo nodo ahora mismo!</AlertDescription>
            </Alert>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomWorkflow
