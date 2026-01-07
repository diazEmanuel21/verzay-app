import { Handle, Position, useConnection } from "@xyflow/react";
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
