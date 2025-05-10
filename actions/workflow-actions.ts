"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createWorkflowSchema, createWorkflowSchemaType } from "@/schema/workflow";
import { WorkflowStatus } from "@/types/workflow";
import { Workflow } from "@prisma/client";
import { redirect } from "next/navigation";
import { deleteAllNodes, deleteFileNode } from "./createNode";

interface GetWorkFlowResponse {
    success: boolean;
    error?: string;
    data?: Workflow[];
};

export const GetWorkFlowforUser = async (userId?: string): Promise<GetWorkFlowResponse> => {
    if (!userId) {
        return { success: false, error: "No autenticado." };
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
        return { success: false, error: "Hubo un problema al obtener los workflows." };
    }
};

export const CreateWorkflow = async (form: createWorkflowSchemaType) => {
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
        throw new Error("Datos del formulario inválidos.");
    }

    const result = await db.workflow.create({
        data: {
            userId: user?.id!, // Asegurarse de que userId no sea undefined
            status: WorkflowStatus.DRAFT,
            definition: "TODO",
            ...data,
        },
    });

    if (!result) {
        throw new Error("Fallo la creación del flujo.");
    }

    redirect(`flow/${result.id}`);
};

export const DeleteWorkflow = async (id: string) => {
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
            // #2. Eliminar archivos de todos los nodos en paralelo
            const deleteResults = await Promise.all(
                nodes.map((node) => deleteFileNode(node?.url ?? '', node.workflowId))
            );

            // #3. Verificar si alguno falló
            const failed = deleteResults.find((res) => !res.success);

            // if (failed) {
            //   return {
            //     success: false,
            //     message: "Error al eliminar uno o más archivos del flujo.",
            //     stage: "files",
            //     detail: failed.message || "Error desconocido en la eliminación de archivos.",
            //   };
            // }
        }

        // ✅ Archivos eliminados, continuar...

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
        const workflowRes = await DeleteWorkflow(workflowId);
        if (!workflowRes.success) {
            return {
                success: false,
                message: "Error al eliminar el flujo.",
                stage: "workflow",
                detail: workflowRes.message,
            };
        }

        // ✅ Todo correcto
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