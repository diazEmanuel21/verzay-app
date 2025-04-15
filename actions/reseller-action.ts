"use server"

import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth"
import { Role } from "@prisma/client"

export const getClientsByReseller = async (resellerId: string) => {
    const user = await currentUser()

    if (!user || user.role !== Role.admin) {
        throw new Error("No autorizado")
    }

    // Clientes asignados a ese reseller
    const assigned = await db.reseller.findMany({
        where: { resellerid: resellerId },
        include: {
            user: true, // Relación con User si está definida
        },
    })

    const assignedIds = assigned.map(r => r.userId)

    //all clients con rol user
    const allClients = await db.user.findMany({
        where: { role: "user" },
    })

    // Clientes sin asignar
    const unassigned = allClients.filter(c => !assignedIds.includes(c.id))

    return {
        assignedClients: assigned.map(r => r.user), // si está incluido el user
        unassignedClients: unassigned,
    }
}

export const assignClientToReseller = async (clientId: string, resellerId: string) => {
    const user = await currentUser()
    if (!user || user.role !== Role.admin) throw new Error("No autorizado")

    return await db.reseller.create({
        data: {
            resellerid: resellerId,
            userId: clientId,
        },
    })
}

export const removeClientFromReseller = async (clientId: string, resellerId: string) => {
    const user = await currentUser()
    if (!user || user.role !== Role.admin) throw new Error("No autorizado")

    return await db.reseller.deleteMany({
        where: {
            resellerid: resellerId,
            userId: clientId,
        },
    })
}