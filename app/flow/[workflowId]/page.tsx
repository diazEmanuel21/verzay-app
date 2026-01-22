import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNodeforUser, getWorkflowEdges } from '@/actions/workflow-node-action';
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
    <div className="flex flex-col flex-1 w-full min-h-0 h-[95vh]">
      <ReactFlowProvider>
        <div className="flex flex-col w-full h-full min-h-0">
          <div className="flex-1 min-h-0 flex w-full">
            <WorkflowSidebar totalNodes={totalNodes} seguimientoNodes={seguimientoNodes} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <WorkflowCanvas
                edgesDB={edgesDB.data}
                nodesDB={nodes}
                workflowId={workflowId}
                user={user}
              />
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default CustomWorkflow