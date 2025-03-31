import { auth } from '@/auth';
import { db } from '@/lib/db';
import React from 'react'
import { GetNodeforUser } from '@/actions/getNodeforUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {NodeCard} from './_components/NodeCard';
import { CreateNodeComponent } from './_components/CrateNodeComponent';

const CustomWorkflow = async ({ params }: { params: { workflowId: string } }) => {
  const { workflowId } = params;

  const nodes = await GetNodeforUser(workflowId);

  const session = await auth();

  const user = await db.user.findUnique({
    where: { email: session?.user.email ?? "" }
  });

  if (!user) return <div>Not authenticated</div>;

  const workflow = await db.workflow.findUnique({
    where: {
      id: workflowId,
      userId: user.id,
    }
  })

  if (!workflow) {
    return <div>Workflow not found</div>
  }

  return (
    <div className='flex flex-col items-center min-h-screen'>
      <div className='absolute top-3 right-2'>
        <CreateNodeComponent workflow={workflow} />
      </div>

      {nodes.length > 0 ? (
        <div className='flex flex-col h-full w-full gap-5 px-4 text-center pt-6' >
          {nodes.map((nodes) => (
            <NodeCard key={nodes.id} nodes={nodes} workflowId={workflow.id} />
            // <NodeCard key={nodes.id}/>
          ))}
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
