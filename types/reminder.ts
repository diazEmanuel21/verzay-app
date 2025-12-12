import { formValuesReminderSchema } from "@/schema/reminder";

export const DEFAULT_REMINDERS_TEMPLATES: Array<
    Pick<formValuesReminderSchema, "title" | "description" | "time">
> = [
        {
            title: "Recordatorio 1 día",
            time: "days-1",
            description:
                "🔔 Recordatorio\n\n@client_name, recuerda que mañana es tu consulta.\nTe recordamos que el tiempo disponible es el que se acordó previamente.",
        },
        {
            title: "Recordatorio 3 horas",
            time: "hours-3",
            description:
                "🔔 Recordatorio\n\n@client_name, en 3 horas inicia tu consulta.\nTe recordamos que el tiempo disponible es el que se acordó previamente.",
        },
        {
            title: "Recordatorio 1 hora",
            time: "hours-1",
            description:
                "🔔 Recordatorio\n\n@client_name, en 1 hora inicia tu consulta.\nTe estaremos atendiendo de forma oportuna en el horario acordado.",
        },
        {
            title: "Recordatorio 5 minutos (consulta)",
            time: "minutes-5",
            description:
                "👨🏻‍💻 Inicio de consulta\n\n⏱ En 5 minutos comenzaremos tu consulta.\n@client_name, por favor mantente atento/a para el ingreso.\n\n👉 https://enlace/asesoria",
        },
        {
            title: "Inicio de consulta",
            time: "minutes-1",
            description: "Listo, @client_name. Comenzamos YA. ✅",
        },
    ];
