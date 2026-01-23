'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowCanvas } from './WorkflowCanvas';
import type { Action, PropsWorkflowCanvas } from '@/types/workflow-node';


export function WorkflowEditorClient({ nodesDB, edgesDB, workflowId, user }: PropsWorkflowCanvas) {
    // Aquí guardamos la función que nos “registra” el canvas para crear nodos
    const createNodeRef = useRef<null | ((action: Action) => void)>(null);

    const totalNodes = nodesDB.length;
    const seguimientoNodes = nodesDB.filter((n: any) =>
        (n?.tipo ?? '').toLowerCase().startsWith('seguimiento')
    ).length;

    return (
        <div className="flex-1 min-h-0 flex w-full">
            <WorkflowSidebar
                totalNodes={totalNodes}
                seguimientoNodes={seguimientoNodes}
                onCreateNode={(action) => {
                    if (!createNodeRef.current) {
                        toast.error('El canvas aún no está listo para crear nodos.', { id: 'canvas-not-ready' });
                        return;
                    }
                    createNodeRef.current(action);
                }}
            />

            <div className="flex-1 min-h-0 overflow-hidden">
                <WorkflowCanvas
                    edgesDB={edgesDB}
                    nodesDB={nodesDB}
                    workflowId={workflowId}
                    user={user}
                    registerCreateNode={(fn) => {
                        createNodeRef.current = fn;
                    }}
                />
            </div>
        </div>
    );
}
