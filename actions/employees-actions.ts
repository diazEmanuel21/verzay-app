"use server";

import { db } from "@/lib/db";
import { EmployeeInput, employeeSchema } from "@/types/employees";
import { revalidatePath } from "next/cache";

export async function getEmployees(userId: string) {
    try {
        const data = await db.employee.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error al obtener empleados" };
    }
}

export async function createOrUpdateEmployee(values: EmployeeInput) {
    const parsed = employeeSchema.parse(values);
    try {
        const data = parsed.id
            ? await db.employee.update({
                where: { id: parsed.id },
                data: parsed,
            })
            : await db.employee.create({ data: parsed });

        revalidatePath("/employees");
        return { success: true, data };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error al guardar empleado" };
    }
}

export async function deleteEmployee(id: string) {
    try {
        await db.employee.delete({ where: { id } });
        revalidatePath("/employees");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error al eliminar empleado" };
    }
}