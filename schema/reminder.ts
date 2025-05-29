import { ApiKey, Instancias, Reminders, Session, User, Workflow } from "@prisma/client";
import { z } from "zod";

export const repeatTypes = [
    { value: "NONE", label: "No se repite" },
    { value: "DAILY", label: "Cada día" },
    { value: "WEEKLY", label: "Cada semana" },
    { value: "MONTHLY", label: "Cada mes" },
    { value: "YEARLY", label: "Cada año" },
    { value: "WEEKDAYS", label: "Días laborables (L-V)" },
    { value: "EVERYDAY", label: "Todos los días" }
] as const;

export const reminderSchema = z.object({
    title: z.string({
        required_error: "El título es obligatorio.",
        invalid_type_error: "El título debe ser un texto.",
    }).min(1, { message: "El título no puede estar vacío." }),

    description: z.string().optional(),

    time: z.string({
        required_error: "La fecha y hora son obligatorias.",
        invalid_type_error: "Selecciona una fecha y hora válidas.",
    }),

    repeatType: z.enum(
        repeatTypes.map(r => r.value) as [string, ...string[]],
        { errorMap: () => ({ message: "Selecciona un tipo de repetición válido." }) }
    ),

    repeatEvery: z.coerce.number()
        .min(1, { message: "Debe ser un número mayor a 0." })
        .optional(),

    userId: z.string({
        required_error: "El ID de usuario es obligatorio.",
    }).min(1, "El ID de usuario es obligatorio."),

    remoteJid: z.string({
        required_error: "El número del lead es obligatorio.",
    }).min(1, "El número del lead es obligatorio."),

    instanceName: z.string({
        required_error: "El nombre de la instancia es obligatorio.",
    }).min(1, "El nombre de la instancia es obligatorio."),

    pushName: z.string({
        required_error: "El nombre del lead es obligatorio.",
    }).min(1, "El nombre del lead es obligatorio."),

    workflowId: z.string().optional(),

    serverUrl: z.string({
        required_error: "serverUrl es obligatorio.",
    }).min(1, "serverUrl es obligatorio."),

    apikey: z.string({
        required_error: "apikey es obligatorio.",
    }).min(1, "apikey es obligatorio."),
})

export type formValuesReminderSchema = z.infer<typeof reminderSchema>

export interface reminderInterface {
    userId: string,
    serverUrl: string,
    apikey: string,
    workflows: Workflow[],
    instanceNameReminder: string,
    leads: Session[],
    initialData?: formValuesReminderSchema | null;
    onSuccess?: () => void,
};

export interface mainReminderInterface {
    user: User,
    apiKey: ApiKey,
    reminders: Reminders[],
    leads: Session[],
    workflows: Workflow[]
    instancia: Instancias
}

export interface reminderListInterface {
    reminder: Reminders
    workflow?: Workflow
}
export interface reminderListClientInterface {
    filteredReminders: Reminders[]
    workflows: Workflow[]
}