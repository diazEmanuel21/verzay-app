'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

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
  useNodesState
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { toast } from 'sonner';
import { updateWorkflowNodePosition } from '@/actions/workflow-node-action';
import { createWorkflowEdge, deleteWorkflowEdge } from '@/actions/workflow-actions';
import { CustomNodeData, PropsWorkflowCanvas } from '@/types/workflow-node';
import { CustomNode } from './';
import { useTheme } from 'next-themes';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function WorkflowCanvas({ nodesDB, workflowId, user, edgesDB }: PropsWorkflowCanvas) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!edgesDB) return [];
    return edgesDB.map((e) => ({
      id: e.id,                  // usa el id de DB
      source: e.sourceId,
      target: e.targetId,
    }));
  }, [edgesDB]);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);


  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const nodeTypes: NodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

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

    try {
      const res = await createWorkflowEdge({
        workflowId,
        sourceId: params.source,
        targetId: params.target,
      });

      if (!res.success || !res.edge) {
        toast.info(res.message || 'No se pudo crear la conexión');
        return;
      }

      const newEdge: Edge = {
        id: res.edge.id,
        source: res.edge.sourceId,
        target: res.edge.targetId,
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


  return (
    <div className="w-full h-[calc(100vh-160px)] rounded-xl border bg-background overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onInit={(instance) => (rfRef.current = instance)}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        onNodeDragStop={onNodeDragStop}
        fitView
        colorMode={isDark ? 'dark' : 'light'}
      >
        <Background
        />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}