"use server"

import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth"
import { reseller, Role, ThemeApp, User } from "@prisma/client"
interface ResellerCustomization {
    userId: string,
    theme?: ThemeApp,
    logo?: string
}
interface ResellerResponse<T = reseller[]> {
    success: boolean;
    message: string;
    data?: T;
};
interface ResellerAsUserResponse<T = User> {
    success: boolean;
    message: string;
    data?: T;
};

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
};

export const isUserAssignedToReseller = async (
    userId: string
): Promise<ResellerAsUserResponse> => {
    debugger;
    try {
        // Buscar si el usuario está asignado a algún reseller
        const assignment = await db.reseller.findFirst({
            where: { userId },
        });

        if (!assignment?.resellerid) {
            return {
                success: false,
                message: "Este usuario no está asignado a ningún reseller.",
            };
        }

        // Buscar el usuario revendedor asignado
        const resellerUser = await db.user.findUnique({
            where: { id: assignment.resellerid },
        });

        if (!resellerUser) {
            return {
                success: false,
                message: "No se encontró el usuario revendedor asociado.",
            };
        }

        return {
            success: true,
            message: "Usuario asignado a un reseller.",
            data: resellerUser,
        };
    } catch (error) {
        console.error("Error en isUserAssignedToReseller:", error);
        return {
            success: false,
            message: "Error interno al buscar asignación de reseller.",
        };
    }
};

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

export async function getThemeForUser(user: User): Promise<ThemeApp> {
    if (!user) return 'Default';

    // Si es reseller, usa su propio theme
    if (user.role === Role.reseller) {
        const resellerTheme = await db.reseller.findFirst({
            where: { userId: user.id },
            select: { theme: true },
        })

        return resellerTheme?.theme || 'Default'
    }

    // Si es un cliente asignado a un reseller, busca el reseller asignado
    if (user.role === Role.user) {
        const reseller = await db.reseller.findFirst({
            where: { userId: user.id },
        })

        if (reseller?.resellerid) {
            return reseller?.theme || 'Default'
        }
    }

    // Por defecto
    return 'Default'
}

export async function updateResellerTheme({
    theme,
    userId,
}: ResellerCustomization): Promise<ResellerResponse> {
    if (!userId) {
        return {
            success: false,
            message: "Se requiere el userId para actualizar el reseller.",
        };
    }

    if (!theme) {
        return {
            success: false,
            message: "Debes proporcionar al menos un campo para actualizar (logo o theme).",
        };
    }

    try {
        const existing = await db.reseller.findFirst({
            where: { userId },
        });

        if (!existing) {
            return {
                success: false,
                message: `No se encontró un reseller con userId: ${userId}`,
            };
        }

        const updated = await db.reseller.update({
            where: { id: existing.id },
            data: {
                ...(theme && { theme }),
            },
        });

        return {
            success: true,
            message: "Reseller actualizado correctamente.",
            data: [updated],
        };
    } catch (error) {
        console.error("Error al actualizar reseller:", error);
        return {
            success: false,
            message: "Ocurrió un error al actualizar el reseller.",
        };
    }
}