"use server"

import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth"
import { Role } from "@prisma/client"
import { getClientDataByUserId } from "./userClientDataActions"

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

export const isUserAssignedToReseller = async (userId: string): Promise<boolean> => {
    // 1. Buscar si existe una relación reseller con ese userId
    const resellerAssignment = await db.reseller.findFirst({
        where: { userId },
    })

    // 2. Retornar true si existe, false si no
    return !!resellerAssignment
}

export const getResellerInformation = async (userId: string) => {
    try {
        // 1. Buscar registros de reseller asignados a este usuario
        const getReseller = await db.reseller.findMany({
            where: { userId },
        });

        if (!getReseller || getReseller.length === 0) {
            return {
                success: false,
                message: "Este usuario no está asignado a ningún reseller.",
                data: null,
            };
        }

        // 2. Tomar el primero de los registros encontrados
        const primaryReseller = getReseller[0];

        if (!primaryReseller || !primaryReseller.resellerid) {
            return {
                success: false,
                message: "No se pudo determinar el ID del revendedor.",
                data: null,
            };
        }

        // 3. Buscar la información del usuario revendedor
        const resellerUser = await db.user.findUnique({
            where: { id: primaryReseller.resellerid },
        });

        if (!resellerUser) {
            return {
                success: false,
                message: "No se encontró información del revendedor.",
                data: null,
            };
        }

        // 4. Todo bien, retornar info
        return {
            success: true,
            message: "Información del revendedor encontrada.",
            data: resellerUser,
        };
    } catch (error: any) {
        console.error("Error al obtener información del revendedor:", error);
        return {
            success: false,
            message: "Ocurrió un error al obtener la información del revendedor.",
            data: null,
        };
    }
};
