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

export type PaletteItem = {
  type: string;      // tipo de ReactFlow: ej "customNode"
  label: string;     // label UI
  nodeTipo: string;  // tu WorkflowNode.tipo (texto, imagen, audio...)
  icon?: React.ReactNode;
};

export const PALETTE: PaletteItem[] = [
  { type: "customNode", label: "Texto", nodeTipo: "texto" },
  { type: "customNode", label: "Imagen", nodeTipo: "imagen" },
  { type: "customNode", label: "Audio", nodeTipo: "audio" },
  { type: "customNode", label: "Documento", nodeTipo: "documento" },
  { type: "customNode", label: "Seguimiento Video", nodeTipo: "seguimiento-video" },
];