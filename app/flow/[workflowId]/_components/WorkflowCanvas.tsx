'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from 'next-themes';

import {
  ReactFlow,
  type Node,
  type Edge,
  type ReactFlowInstance,
  type NodeTypes,
  type OnConnect,
  type OnEdgesDelete,
  Background,
  Controls,
  MiniMap,
  OnNodeDrag,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react';

import { toast } from 'sonner';
import { createNodeFromCanvas, updateWorkflowNodePosition } from '@/actions/workflow-node-action';
import { createWorkflowEdge, deleteWorkflowEdge } from '@/actions/workflow-node-action';
import { CustomNodeData, PaletteItem, PropsWorkflowCanvas } from '@/types/workflow-node';
import { CustomEdge, CustomNode } from '.';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function WorkflowCanvas({ nodesDB, workflowId, user, edgesDB }: PropsWorkflowCanvas) {
  const { resolvedTheme } = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const [mounted, setMounted] = useState(false);

  const rfRef = useRef<ReactFlowInstance<Node<CustomNodeData>, Edge> | null>(null);
  const totalNodes = useMemo(() => nodesDB.length, [nodesDB]);
  const seguimientoNodes = useMemo(
    () => nodesDB.filter((n) => (n.tipo ?? '').toLowerCase().includes('seguimiento')).length,
    [nodesDB]
  );

  const initialNodes: Node<CustomNodeData>[] = useMemo(() => {
    const sorted = [...nodesDB].sort((a, b) => a.order - b.order);

    return sorted.map((n, idx) => {
      const x = n.posX ?? 0;
      const y = n.posY ?? 0;
      const needsAuto = x === 0 && y === 0 && sorted.length > 1;

      return {
        id: n.id,
        type: 'customNode',
        position: needsAuto ? { x: 80, y: 80 + idx * 140 } : { x, y },
        data: {
          nodeDB: n,
          workflowId,
          user,
          totalNodes,
          seguimientoNodes,
        },
      };
    });
  }, [nodesDB, workflowId, user]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!edgesDB) return [];
    return edgesDB.map((e) => ({
      id: e.id,                  // usa el id de DB
      source: e.sourceId,
      target: e.targetId,
      sourceHandle: e.sourceHandle ?? "out",
      targetHandle: e.targetHandle ?? "in",
      type: 'customEdge',
    }));
  }, [edgesDB]);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);


  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const isDark = mounted && resolvedTheme === "dark";
  const nodeTypes: NodeTypes = useMemo(() => ({ customNode: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: CustomEdge }), []);

  const pending = useRef<Record<string, number>>({});

  const onNodeDragStop: OnNodeDrag = useCallback(async (_, node) => {
    const { id, position } = node;

    if (pending.current[id]) window.clearTimeout(pending.current[id]);

    const t = window.setTimeout(async () => {
      try {
        const posX = clamp(Number(position.x.toFixed(2)), -100000, 100000);
        const posY = clamp(Number(position.y.toFixed(2)), -100000, 100000);

        await updateWorkflowNodePosition({ nodeId: id, posX, posY });
      } catch (e: any) {
        toast.error(e?.message ?? 'No se pudo guardar la posición del nodo');
      }
      delete pending.current[id];
    }, 350);

    pending.current[id] = t;
  }, []);

  // conectar
  const onConnect: OnConnect = useCallback(async (params) => {
    if (!params.source || !params.target) return;

    const sourceHandle = params.sourceHandle ?? "out";
    const targetHandle = params.targetHandle ?? "in";

    try {
      const res = await createWorkflowEdge({
        workflowId,
        sourceId: params.source,
        targetId: params.target,
        sourceHandle,
        targetHandle,
      });

      if (!res.success || !res.edge) {
        toast.info(res.message || 'No se pudo crear la conexión');
        return;
      }

      const newEdge: Edge = {
        id: res.edge.id,
        source: res.edge.sourceId,
        target: res.edge.targetId,
        sourceHandle: res.edge.sourceHandle ?? "out",
        targetHandle: res.edge.targetHandle ?? "in",
        type: 'customEdge',
      };

      setEdges((eds) => [...eds, newEdge]);
    } catch (e: any) {
      toast.error(e?.message ?? 'No se pudo crear la conexión');
    }
  }, [workflowId, setEdges]);

  const onEdgesDelete: OnEdgesDelete = useCallback(async (deleted) => {
    // borra uno por uno (MVP)
    for (const edge of deleted) {
      try {
        const res = await deleteWorkflowEdge({ workflowId, edgeId: edge.id });
        toast.success(res.message || 'Relación eliminada.')
      } catch (e: any) {
        toast.error(e?.message ?? 'No se pudo eliminar la conexión');
      }
    }
  }, [workflowId]);

  const onDragOver = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(async (evt: React.DragEvent) => {
    evt.preventDefault();

    const raw = evt.dataTransfer.getData("application/reactflow");
    if (!raw) return;

    let item: PaletteItem;
    try {
      item = JSON.parse(raw);
    } catch {
      return;
    }

    // coordenadas del drop en el canvas
    const pos = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });

    const toastId = toast.loading("Creando nodo...");

    try {
      const res = await createNodeFromCanvas({
        workflowId,
        tipo: item.nodeTipo,
        message: "",
        posX: pos.x,
        posY: pos.y,
      });

      if (!res?.success) {
        toast.error(res?.message ?? "No se pudo crear el nodo", { id: toastId });
        return;
      }

      const nodeDB = res.data;

      if (!nodeDB) return toast.error('Ups! error al crear el nodo.')

      setNodes((nds) =>
        nds.concat({
          id: nodeDB.id,
          type: "customNode",
          position: { x: nodeDB.posX ?? pos.x, y: nodeDB.posY ?? pos.y },
          data: {
            nodeDB,
            workflowId,
            user,
            totalNodes: totalNodes + 1,
            seguimientoNodes,
          },
        } satisfies Node<CustomNodeData>)
      );

      toast.success("Nodo creado", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message ?? "Error creando nodo", { id: toastId });
    }
  }, [screenToFlowPosition, workflowId, user, setNodes]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onInit={(instance) => (rfRef.current = instance)}
        defaultEdgeOptions={{ type: 'customEdge' }}
        connectionLineStyle={{
          stroke: 'hsl(var(--primary) / 0.65)',
          strokeWidth: 2.5,
        }}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        colorMode={isDark ? "dark" : "light"}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}