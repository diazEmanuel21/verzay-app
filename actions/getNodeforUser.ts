"use server"

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db"   


export async function GetNodeforUser(workflowId?: string) {

    return db.workflowNode.findMany({
        where: {
            workflowId,
        },
        orderBy: {
            createdAt: "asc"
        }
    })
}