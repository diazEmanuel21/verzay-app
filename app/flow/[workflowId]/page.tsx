import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InboxIcon } from 'lucide-react';
import { getNodeforUser } from '@/actions/workflow-node-action';
import { getWorkflowEdges } from '@/actions/workflow-actions';
import { WorkflowCanvas } from './_components/WorkflowCanvas';
import { WorkflowSidebar } from './_components/WorkflowSidebar';
import { ReactFlowProvider } from '@xyflow/react';

const CustomWorkflow = async ({ params }: { params: { workflowId: string } }) => {
  const user = await currentUser();
  if (!user) {
    redirect('/login');
  };

  const { workflowId } = params;

  const nodes = await getNodeforUser(workflowId);
  const edgesDB = await getWorkflowEdges(workflowId);
  const totalNodes = nodes.length;
  const seguimientoNodes = nodes.filter((n: any) =>
    (n?.tipo ?? "").toLowerCase().startsWith("seguimiento")
  ).length;


  return (
    <div className='flex flex-col items-center min-h-full'>
      {nodes.length > 0 ? (
        <div className='flex flex-col h-full w-full text-center'>
          <div className="flex flex-row gap-4">
            <ReactFlowProvider>
              <WorkflowSidebar totalNodes={totalNodes} seguimientoNodes={seguimientoNodes}/>
              <div className="flex flex-1">
                <WorkflowCanvas edgesDB={edgesDB.data} nodesDB={nodes} workflowId={workflowId} user={user} />
              </div>
            </ReactFlowProvider>
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
        </div>
      )}
    </div>
  );
}

export default CustomWorkflow


