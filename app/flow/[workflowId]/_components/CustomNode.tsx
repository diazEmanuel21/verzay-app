import { Handle, Position, useConnection } from "@xyflow/react";
import { NodeCard } from "./NodeCard";
import { CustomNodeData } from "@/types/workflow-node";

export function CustomNode({ data }: { data: CustomNodeData }) {
    const connection = useConnection();

    const isTarget =
        connection.inProgress && connection.fromNode?.id !== data.nodeDB.id;

    const isSourceActive =
        connection.inProgress && connection.fromNode?.id === data.nodeDB.id;

    return (
        <div className="relative min-w-[320px]">
            <NodeCard
                nodes={data.nodeDB as any}
                workflowId={data.workflowId}
                user={data.user}
                targetHandle={
                    <Handle
                        id="in"
                        type="target"
                        position={Position.Top}
                        isConnectable={!connection.inProgress || isTarget}
                        isConnectableStart={false}
                    />
                }
            />

            <div className="pointer-events-none absolute -bottom-[10px] left-1/2 z-20 -translate-x-1/2">
                <div
                    className={[
                        "rounded-full bg-white p-[2px]",
                        "border shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
                        (!connection.inProgress || isSourceActive)
                            ? "border-blue-200"
                            : "border-zinc-200",
                    ].join(" ")}
                >
                    <div
                        className={[
                            "h-3 w-3 rounded-full",
                            (!connection.inProgress || isSourceActive)
                                ? "bg-blue-500"
                                : "bg-zinc-400",
                        ].join(" ")}
                    />
                </div>
            </div>

            <Handle
                id="out"
                type="source"
                position={Position.Bottom}
                isConnectableStart={!connection.inProgress}
                style={{
                    width: "100%",
                    height: 18,
                    opacity: 0,
                    zIndex: 10,
                }}
            />
        </div>
    );
}
