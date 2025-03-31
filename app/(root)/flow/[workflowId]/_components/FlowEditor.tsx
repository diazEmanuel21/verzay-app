"use client";

import { Workflow } from '@prisma/client'
import "@xyflow/react/dist/style.css"
import { GetNodeforUser } from '@/actions/getNodeforUser';
import { CreateNodeComponent } from './CrateNodeComponent';

function FlowEditor({ workflow }: { workflow: Workflow }) {
  const nodes = GetNodeforUser(workflow.id);

  return (
    <main className="h-full w-full">
      <CreateNodeComponent workflow={workflow} />
    </main>
  )
}

export default FlowEditor
