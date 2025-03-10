import { auth } from '@/auth';
import { db } from '@/lib/db';
import { waitFor } from '@/lib/waitFor';
import React from 'react'
import Node from '../_components/Node';
import { GetNodeforUser } from '@/actions/getNodeforUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import NodeCard from '../_components/NodeCard';

async function page({params}:{ params: {workflowId: string}} ) {
  const {workflowId} = params;

  const nodes = await GetNodeforUser(workflowId);
 
  const session = await auth();

  const user = await db.user.findUnique({
    where: {email: session?.user.email ?? ""}
  });
  
  if (!user) return <div>Not authenticated</div>;
  
  const workflow = await db.workflow.findUnique({
    where: {
        id: workflowId,
        userId: user.id,
    }
  })

  if(!workflow){
    return <div>Workflow not found</div>
  }

  if(nodes.length === 0){
   return(
    
    <div className='flex h-full w-full flex-col gap-5 mb-1 items-center justify-center' >
      <h1 className="text-4xl font-bold m-4">Bienvenido, crea tu flujo</h1>
      <div className='flex flex-col gap-2'>
      <Alert>
        <AlertTitle>No tienes ningun nodo creado</AlertTitle>
        <AlertDescription>Crea un nuevo nodo ahora mismo!</AlertDescription>
      </Alert>
      <Node workflow={workflow} />
      </div>
    </div>
   )
  }
    
  return (
    <div className='flex flex-col h-full w-full gap-5 px-4 text-center' >
      <h1 className="text-4xl font-bold m-4">Bienvenido, crea tu flujo</h1>
      <Node workflow={workflow} />
      {nodes.map((nodes)=>(
            <NodeCard key={nodes.id} nodes={nodes} workflowId={workflow.id} />
        ))}
    </div>
  )
}

export default page
