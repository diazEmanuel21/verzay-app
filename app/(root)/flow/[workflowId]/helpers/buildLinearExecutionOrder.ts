import { EdgeDB, NodeDB } from "@/types/workflow";

export function buildLinearExecutionOrder(nodes: NodeDB[], edges: EdgeDB[]) {
    if (!nodes.length) return [];

    // START: el primero creado
    const start = [...nodes].sort((a, b) => a.order - b.order)[0];

    // source -> target (lineal)
    const nextBySource = new Map<string, string>();
    for (const e of edges) nextBySource.set(e.sourceId, e.targetId);

    const visited = new Set<string>();
    const ordered: string[] = [];

    let currentId: string | undefined = start.id;

    while (currentId) {
        if (visited.has(currentId)) {
            // ciclo detectado
            throw new Error('Ciclo detectado en el workflow (conexiones inválidas)');
        }

        visited.add(currentId);
        ordered.push(currentId);

        currentId = nextBySource.get(currentId);
    }

    return ordered; // lista de nodeIds en orden de ejecución
}