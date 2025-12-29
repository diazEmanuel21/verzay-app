import { CustomNodeData } from '@/types/workflow-node';
import { Handle, Position, useConnection } from '@xyflow/react';
import { NodeCard } from './';

export const CustomNode = ({ data }: { data: CustomNodeData }) => {
    const connection = useConnection();

    const isTarget =
        connection.inProgress &&
        connection.fromNode?.id !== data.nodeDB.id;

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

            <Handle
                type="source"
                position={Position.Bottom}
                isConnectableStart={!connection.inProgress}
            />
        </div>
    );
};
