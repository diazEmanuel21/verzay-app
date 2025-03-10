"use client";

import { Workflow } from '@prisma/client'
import { Background, BackgroundVariant, Controls, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import React from 'react'
import "@xyflow/react/dist/style.css"
import { Button } from '@/components/ui/button';
import Node from './Node';
import { GetNodeforUser } from '@/actions/getNodeforUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function FlowEditor({workflow}:{workflow: Workflow}) {

  const nodes = await GetNodeforUser(workflow.id);



  return (
    <main className="h-full w-full">
      <Node workflow={workflow} />
    </main>
  )
}

export default FlowEditor
