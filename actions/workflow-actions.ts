"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createWorkflowSchema, createWorkflowSchemaType } from "@/schema/workflow";
import { WorkflowStatus } from "@/types/workflow";
import { Workflow } from "@prisma/client";
import { redirect } from "next/navigation";
import { deleteAllNodes, deleteFileNode } from "./workflow-node-action";

interface GetWorkFlowResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: Workflow[];
};
interface RROperationResponse {
    success: boolean;
    message: string;
    data?: Workflow[];
};

export const getWorkFlowByUser = async (userId?: string): Promise<GetWorkFlowResponse> => {
    if (!userId) {
        return { success: false, error: "No autenticado.", message: "No autenticado." };
    }

    try {
        const workflows = await db.workflow.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return { success: true, data: workflows };
    } catch (error) {
        console.error("Error al obtener los workflows:", error);
        return { success: false, error: "Hubo un problema al obtener los workflows.", message: "Hubo un problema al obtener los workflows." };
    }
};

export const createWorkflow = async (form: createWorkflowSchemaType) => {
    const session = await auth(); // Obtén la sesión del usuario

    const user = await db.user.findUnique({
        where: { email: session?.user.email ?? "" }
    });

    if (!session?.user?.id) {
        console.log("Usuario no autenticado");
    }

    console.log("Sesión del usuario: ", session);


    const { success, data } = createWorkflowSchema.safeParse(form);

    if (!success) {
        return { success: false, message: 'Datos del formulario inválidos.' };
    }

    const result = await db.workflow.create({
        data: {
            userId: user?.id!, // Asegurarse de que userId no sea undefined
            status: WorkflowStatus.DRAFT,
            definition: "workflow",
            ...data,
        },
    });

    if (!result) {
        return { success: false, message: 'Fallo la creación del flujo.' };
    }

    redirect(`flow/${result.id}`);
};

export const deleteWorkflow = async (id: string) => {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return {
                success: false,
                message: "No se encontró una sesión activa.",
            };
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return {
                success: false,
                message: "Usuario no encontrado en la base de datos.",
            };
        }

        const deleted = await db.workflow.delete({
            where: {
                id,
                userId: user.id,
            },
        });

        return {
            success: true,
            message: `Flujo "${deleted.name}" eliminado correctamente.`,
            data: deleted,
        };
    } catch (error: any) {
        console.error("Error al eliminar el flujo:", error);

        return {
            success: false,
            message: "Ocurrió un error al eliminar el flujo.",
            error: error?.message || error,
        };
    }
};

export const deleteEntireWorkflow = async (userId: string, workflowId: string) => {
    try {
        // #1. Se obtienen todos los nodos
        const nodes = await db.workflowNode.findMany({ where: { workflowId } });

        if (nodes.length > 0) {
            const nodesWithFile = nodes.filter((n) => !!n.url);

            // #2. Eliminar archivos de todos los nodos en paralelo
            const deleteResults = await Promise.all(
                nodesWithFile.map((node) => deleteFileNode(node.url!, node.id))
            );

            // #3. Verificar si alguno falló
            const failed = deleteResults.find((res) => !res.success);

            if (failed) {
                return {
                    success: false,
                    message: "Error al eliminar uno o más archivos del flujo.",
                    stage: "files",
                    detail: failed.message || "Error desconocido en la eliminación de archivos.",
                };
            }
        }

        // #4. Eliminar nodos
        const nodesRes = await deleteAllNodes(workflowId);
        if (!nodesRes.success) {
            return {
                success: false,
                message: "Error al eliminar los nodos del flujo.",
                stage: "nodes",
                detail: nodesRes.message,
            };
        }

        // #5. Eliminar el flujo
        const workflowRes = await deleteWorkflow(workflowId);
        if (!workflowRes.success) {
            return {
                success: false,
                message: "Error al eliminar el flujo.",
                stage: "workflow",
                detail: workflowRes.message,
            };
        }

        return {
            success: true,
            message: "Flujo y datos relacionados eliminados correctamente.",
        };
    } catch (error) {
        console.error("Error inesperado en deleteEntireWorkflow:", error);
        return {
            success: false,
            message: "Error inesperado al eliminar el flujo completo.",
            stage: "general",
            detail: error instanceof Error ? error.message : String(error),
        };
    }
};

export const updateWorkflow = async (id: string, data: Partial<Workflow>): Promise<RROperationResponse> => {
    try {
        if (!id) {
            return { success: false, message: "Identificador no proporcionado." };
        };

        await db.workflow.update({
            where: { id },
            data,
        });

        return {
            success: true,
            message: 'Registro actualizado correctamente.',
        };

    } catch (error) {
        return {
            success: false,
            message: 'Error al actualizar el registro.',
        };
    }
};

export async function createWorkflowEdge(params: {
    workflowId: string;
    sourceId: string;
    targetId: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized.' };

    const { workflowId, sourceId, targetId } = params;

    if (sourceId === targetId) return { success: false, message: 'No puedes conectar un nodo consigo mismo.' };

    const existing = await db.workflowEdge.findFirst({
        where: {
            workflowId,
            sourceId,
        },
        select: { id: true },
    });

    if (existing) {
        return { success: false, message: 'Nodo ya relacionado con otro nodo.' };
    }

    // validar que el workflow es del usuario
    const wf = await db.workflow.findFirst({
        where: { id: workflowId, userId: session.user.id },
        select: { id: true },
    });
    if (!wf) return { success: false, message: 'Workflow no encontrado.' };

    // vlidar que ambos nodos pertenecen a ese workflow
    const nodes = await db.workflowNode.findMany({
        where: {
            id: { in: [sourceId, targetId] },
            workflowId,
        },
        select: { id: true },
    });
    if (nodes.length !== 2) return { success: false, message: 'Nodos inválidos para este workflow.' };

    // crear edge (evita duplicado por @@unique)
    const edge = await db.workflowEdge.create({
        data: { workflowId, sourceId, targetId },
        select: { id: true, sourceId: true, targetId: true },
    });

    return { success: true, edge };
}

export async function deleteWorkflowEdge(params: {
    workflowId: string;
    edgeId: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized.' };

    const { workflowId, edgeId } = params;

    // ✅ validar ownership del workflow
    const wf = await db.workflow.findFirst({
        where: { id: workflowId, userId: session.user.id },
        select: { id: true },
    });
    if (!wf) return { success: false, message: 'Workflow no encontrado.' };

    // borrar solo si el edge pertenece al workflow
    await db.workflowEdge.deleteMany({
        where: { id: edgeId, workflowId },
    });

    return { success: true, message: 'Se eliminó la relación correctamente.' };
}

export async function getWorkflowEdges(workflowId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized.' };

    // ownership
    const wf = await db.workflow.findFirst({
        where: { id: workflowId, userId: session.user.id },
        select: { id: true },
    });
    if (!wf) return { success: false, message: 'Workflow no encontrado.' };

    const edges = await db.workflowEdge.findMany({
        where: { workflowId },
        select: { id: true, sourceId: true, targetId: true },
        orderBy: { createdAt: 'asc' },
    });

    return { success: true, message: 'ok', data: edges };
}