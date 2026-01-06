'use client';

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { baseActions, seguimientoActions } from "../helpers";
import { Action } from "../types";
import { MAX_NODES_PER_WORKFLOW, MAX_SEGUIMIENTOS_PER_WORKFLOW } from "@/types/workflow";
import { ActionSidebarDraggable } from "./";

type Props = {
    totalNodes: number;
    seguimientoNodes: number;
};

export function WorkflowSidebar({ totalNodes, seguimientoNodes }: Props) {
    const [q, setQ] = useState("");
    const [isOpenSeguimientos, setIsOpenSeguimientos] = useState(false);

    const allActions = useMemo(() => [...baseActions, ...seguimientoActions], []);
    const qLower = q.trim().toLowerCase();

    const filteredBase = useMemo(() => {
        if (!qLower) return baseActions;
        return baseActions.filter(a =>
            a.label.toLowerCase().includes(qLower) || a.type.toLowerCase().includes(qLower)
        );
    }, [qLower]);

    const filteredSeguimientos = useMemo(() => {
        if (!qLower) return seguimientoActions;
        return seguimientoActions.filter(a =>
            a.label.toLowerCase().includes(qLower) || a.type.toLowerCase().includes(qLower)
        );
    }, [qLower]);

    const reachedTotalLimit = totalNodes >= MAX_NODES_PER_WORKFLOW;
    const reachedSeguimientoLimit = seguimientoNodes >= MAX_SEGUIMIENTOS_PER_WORKFLOW;

    const onDragStart = (evt: React.DragEvent, action: Action) => {
        // UX: mismas validaciones que tu CreateNodeComponent (solo para feedback rápido)
        if (reachedTotalLimit) {
            toast.error(
                `Este flujo ya alcanzó el límite de ${MAX_NODES_PER_WORKFLOW} nodos.`,
                { id: "sidebar-drag-limit" }
            );
            evt.preventDefault();
            return;
        }

        const isSeguimiento = action.type.startsWith("seguimiento-") || action.type === "seguimiento";
        if (isSeguimiento && reachedSeguimientoLimit) {
            toast.error(
                `Este flujo ya tiene el máximo de ${MAX_SEGUIMIENTOS_PER_WORKFLOW} seguimientos permitidos.`,
                { id: "sidebar-drag-limit" }
            );
            evt.preventDefault();
            return;
        }

        // ✅ Formato que espera tu onDrop: item.nodeTipo
        const payload = {
            type: "customNode",     // ReactFlow node type
            label: action.label,
            nodeTipo: action.type,  // tu WorkflowNode.tipo
        };

        evt.dataTransfer.setData("application/reactflow", JSON.stringify(payload));
        evt.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside className="w-[280px] shrink-0 border-r bg-background p-3">
            <div className="mb-3">
                <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            {/* Contadores tipo CreateNodeComponent */}
            <div className="mb-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-3">
                    <span className={cn(reachedTotalLimit && "text-destructive")}>
                        {`Nodos: ${totalNodes}/${MAX_NODES_PER_WORKFLOW}`}
                    </span>
                    <span className={cn(reachedSeguimientoLimit && "text-destructive")}>
                        {`Seguimientos: ${seguimientoNodes}/${MAX_SEGUIMIENTOS_PER_WORKFLOW}`}
                    </span>
                </div>
            </div>

            {/* Base actions */}
            <div className="space-y-2">
                {filteredBase.map((action) => (
                    <ActionSidebarDraggable
                        key={action.type}
                        action={action}
                        onDragStart={onDragStart}
                        disabled={reachedTotalLimit}
                    />
                ))}

                {/* Seguimientos */}
                <div className="pt-2">
                    <button
                        type="button"
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpenSeguimientos((p) => !p)}
                    >
                        {isOpenSeguimientos ? "Ocultar seguimientos" : "Ver seguimientos"}
                    </button>

                    <Collapsible open={isOpenSeguimientos} onOpenChange={setIsOpenSeguimientos}>
                        <CollapsibleContent className="mt-2 ml-2 space-y-2">
                            {filteredSeguimientos.map((action) => (
                                <ActionSidebarDraggable
                                    key={action.type}
                                    action={action}
                                    onDragStart={onDragStart}
                                    disabled={reachedTotalLimit || reachedSeguimientoLimit}
                                />
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>
        </aside>
    );
}
