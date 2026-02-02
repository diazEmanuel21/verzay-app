import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNodeforUser, getWorkflowEdges } from '@/actions/workflow-node-action';
import { ReactFlowProvider } from '@xyflow/react';

import { WorkflowEditorClient } from './_components';

const CustomWorkflow = async ({ params }: { params: { workflowId: string } }) => {
  const user = await currentUser();
  if (!user) {
    redirect('/login');
  }

  const { workflowId } = params;

  const nodes = await getNodeforUser(workflowId);
  const edgesDB = await getWorkflowEdges(workflowId);

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 h-[95vh]">
      <ReactFlowProvider>
        <div className="flex flex-col w-full h-full min-h-0">
          <div className="flex-1 min-h-0 flex w-full">
            <WorkflowEditorClient
              nodesDB={nodes}
              edgesDB={edgesDB.data}
              workflowId={workflowId}
              user={user}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default CustomWorkflow;