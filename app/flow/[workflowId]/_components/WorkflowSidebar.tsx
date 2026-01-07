'use client';

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MAX_NODES_PER_WORKFLOW, MAX_SEGUIMIENTOS_PER_WORKFLOW } from "@/types/workflow";
import { ActionSidebarDraggable } from "./";
import { Button } from "@/components/ui/button";
import { ChevronDown, Lock, Unlock } from "lucide-react";
import { Action, baseActions, seguimientoActions } from "@/types/workflow-node";

type Props = {
    totalNodes: number;
    seguimientoNodes: number;
};

export const CategorySection = ({
    title,
    children,
    right,
}: {
    title: string;
    children: React.ReactNode;
    right?: React.ReactNode;
}) => {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs">{title}</p>
                {right}
            </div>
            {children}
        </div>
    );
}

export function WorkflowSidebar({ totalNodes, seguimientoNodes }: Props) {
    const [q, setQ] = useState("");
    const [isOpenSeguimientos, setIsOpenSeguimientos] = useState(false);
    const [locked, setLocked] = useState(true);

    const allActions = useMemo(() => [...baseActions, ...seguimientoActions], []);
    const qLower = q.trim().toLowerCase();

    const filteredBase = useMemo(() => {
        const list = baseActions.filter(a => a.type !== "seguimiento");
        if (!qLower) return list;
        return list.filter(a =>
            a.label.toLowerCase().includes(qLower) || a.type.toLowerCase().includes(qLower)
        );
    }, [qLower]);

    const filteredSeguimientos = useMemo(() => {
        const list = seguimientoActions.filter(a => a.type !== "seguimiento");
        if (!qLower) return list;
        return list.filter(a =>
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
        <aside
            className={cn(
                "group relative h-full border-r bg-background transition-all duration-200 ease-out",
                locked ? "w-[320px]" : "w-12 hover:w-[320px]"
            )}
        >
            {/* Header siempre visible */}
            <div className="flex items-center gap-2 p-2 border-b">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocked(v => !v)}
                    className="shrink-0"
                    title={locked ? "Sidebar fijo" : "Sidebar por hover"}
                >
                    {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>

                {/* Search aparece solo expandido */}
                <div className={cn("flex-1 transition-opacity duration-150", locked ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
            </div>

            <div className={cn("p-3 h-[calc(100%-48px)] overflow-y-auto", locked ? "block" : "hidden group-hover:block")}>
                {/* Contadores */}
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

                <div className="space-y-5">
                    <CategorySection title="Base">
                        <div className="grid grid-cols-2 gap-2">
                            {filteredBase.map((action) => (
                                <ActionSidebarDraggable
                                    key={action.type}
                                    action={action}
                                    onDragStart={onDragStart}
                                    disabled={reachedTotalLimit}
                                />
                            ))}
                        </div>
                    </CategorySection>

                    <CategorySection
                        title="Seguimientos"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {filteredSeguimientos.map((action) => (
                                <ActionSidebarDraggable
                                    key={action.type}
                                    action={action}
                                    onDragStart={onDragStart}
                                    disabled={reachedTotalLimit || reachedSeguimientoLimit}
                                />
                            ))}
                        </div>
                    </CategorySection>
                </div>
            </div>
        </aside>
    );
}
