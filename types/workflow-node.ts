import { User, WorkflowNode } from "@prisma/client";

export type WorkflowNodeDB = {
  id: string;
  message: string;
  tipo: string;
  url?: string | null;
  delay?: string | null;
  inactividad?: boolean | null;
  name_file?: string | null;
  order: number;
  posX?: number | null;
  posY?: number | null;
};

export type WorkflowEdgeDB = { id: string; sourceId: string; targetId: string };

export type PropsWorkflowCanvas = {
  nodesDB: WorkflowNodeDB[];
  edgesDB?: WorkflowEdgeDB[];
  workflowId: string;
  user: User;
};

export type CustomNodeData = {
  nodeDB: WorkflowNodeDB; // cambiar a tu DTO real
  workflowId: string;
  user: User;
  totalNodes: number;
  seguimientoNodes: number;
};

export interface PropsNodeCard {
  workflowId: string;
  nodes: WorkflowNode;
  user: User;
  targetHandle?: React.ReactNode;
}

export const MAX_MESSAGE_LENGTH = 1000;