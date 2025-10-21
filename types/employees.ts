import { Employee, User } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import z from "zod";

/* ────────────────────────────────────────────────────────────────
   🧩 Prisma model (Referencia)
   model Employee {
     id          String   @id @default(cuid())
     userId      String
     user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     name        String
     role        String?
     email       String?
     phone       String?
     timezone    String?  @default("America/Bogota")
     isActive    Boolean  @default(true)
     appointments Appointment[]
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }
───────────────────────────────────────────────────────────────────*/

// 🧱 Esquema de validación (Zod)
export const employeeSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    name: z.string().min(2, "El nombre es obligatorio"),
    role: z.string().nullable().optional(),        // ✅ coincide con Prisma
    email: z.string().email("Email inválido").nullable().optional(),
    phone: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),    // ✅ coincide con Prisma
    isActive: z.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/* ────────────────────────────────────────────────────────────────
   👥 Relaciones derivadas
───────────────────────────────────────────────────────────────────*/

// Usuario con empleados
export interface UserWithEmployees extends User {
    Employees?: Employee[]; // ✅ opcional y coincide con Prisma
}

/* ────────────────────────────────────────────────────────────────
   🧠 Props para componentes
───────────────────────────────────────────────────────────────────*/

// Props del contenedor principal
export interface MainEmployeesProps {
    user: UserWithEmployees;
    employees: Employee[]; // ✅ se usa directamente desde Prisma
}

export type FormData = z.infer<typeof employeeSchema>;

export interface EmployeeFormProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    userId: string;
    employee?: FormData | null;
}

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}