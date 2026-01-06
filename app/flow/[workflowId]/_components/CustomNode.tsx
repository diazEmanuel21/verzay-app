import { Button } from "@/components/ui/button";
import { Handle, Position, useConnection } from "@xyflow/react";
import { Plus } from "lucide-react";
import { CreateNodeComponent } from "./CrateNodeComponent";
import { NodeCard } from "./NodeCard";
import { CustomNodeData } from "@/types/workflow-node";

export function CustomNode({ data }: { data: CustomNodeData }) {
    const connection = useConnection();
    const isTarget = connection.inProgress && connection.fromNode?.id !== data.nodeDB.id;

    return (
        <div className="relative min-w-[320px]">

            <NodeCard
                nodes={data.nodeDB as any}
                workflowId={data.workflowId}
                user={data.user}
                targetHandle={
                    <Handle
                        type="target"
                        position={Position.Top}
                        isConnectable={(!connection.inProgress || isTarget)}
                        isConnectableStart={false}
                    />
                }
            />

            {/* ✅ Botón + para agregar nodo (no inicia conexión) */}
            {/* <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 nodrag z-[9999]">
                <CreateNodeComponent
                    workflowId={data.workflowId}
                    plan={data.user?.plan}
                    totalNodes={data.totalNodes}
                    seguimientoNodes={data.seguimientoNodes}
                    trigger={
                        <Button size="icon" className="h-8 w-8 rounded-full shadow-md">
                            <Plus  />
                        </Button>
                    }
                />
            </div> */}

            {/* SOURCE handle real (para conectar manualmente) */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectableStart={!connection.inProgress}
                style={{
                    width: '100%',
                    height: 18,
                    opacity: 0,
                    zIndex: 10,
                }}
            />
        </div>
    );
}
