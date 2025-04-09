"use server";

import { db } from "@/lib/db";
import { Workflow } from "@prisma/client";

interface GetWorkFlowResponse {
    success: boolean;
    data?: Workflow[];
    error?: string;
}

export async function GetWorkFlowforUser(userId?: string): Promise<GetWorkFlowResponse> {
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
}
