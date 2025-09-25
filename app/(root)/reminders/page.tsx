import { MainReminders } from "./_components"
import { currentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getApiKeyById } from "@/actions/api-action"
import { ApiKey, Instancias, Reminders, Session, Workflow } from "@prisma/client"
import { getRemindersByUserId } from "@/actions/reminders-actions"
import { getSessionsByUserId } from "@/actions/session-action"
import { getWorkFlowByUser } from "@/actions/workflow-actions"
import { getInstancesByUserId } from "@/actions/instances-actions"

function hasApiKey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
    return !!result.data
}

function hasReminder(result: { data?: Reminders[] }): result is { data: Reminders[] } {
    return !!result.data
}

function hasSession(result: { data?: Session[] }): result is { data: Session[] } {
    return !!result.data
}

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data
}

// CORRECCIÓN: Se actualizó la función para manejar un array de instancias.
// Esto coincide con el tipo de dato que getInstancesByUserId devuelve.
function hasInstancia(result: { data?: Instancias[] }): result is { data: Instancias[] } {
    return !!result.data && result.data.length > 0;
}

const RemindersPage = async () => {
    const user = await currentUser()
    if (!user) redirect("/login")

    // Obtener API Key
    const resApikey = await getApiKeyById(user.apiKeyId)
    if (!resApikey.success || !hasApiKey(resApikey)) {
        console.error("[REMINDERS_PAGE] No se encontró una API Key válida para el usuario.")
        return <strong className="text-red-500">No se encontró una API Key válida.</strong>
    }

    // Obtener recordatorios
    const resReminder = await getRemindersByUserId(user.id)
    if (!resReminder.success) {
        console.error("[REMINDERS_PAGE] Error al obtener recordatorios:", resReminder.message)
        return <strong>404</strong>
    }
    const reminders = hasReminder(resReminder) ? resReminder.data : []

    // Obtener sesiones
    const resSession = await getSessionsByUserId(user.id)
    if (!resSession.success) {
        console.error("[REMINDERS_PAGE] Error al obtener sesiones:", resSession.message)
        return <strong>404</strong>
    }
    const sessions = hasSession(resSession) ? resSession.data : []

    // Obtener workflows
    const resWorkflow = await getWorkFlowByUser(user.id)
    if (!resWorkflow.success) {
        console.error("[REMINDERS_PAGE] Error al obtener flujos de trabajo:", resWorkflow.message)
        return <strong>404</strong>
    }
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : []


    const resInstancia = await getInstancesByUserId(user.id)
    // Ahora, la función hasInstancia funciona correctamente.
    if (!resInstancia.success || !hasInstancia(resInstancia)) {
        console.error("[REMINDERS_PAGE] No se encontró una instancia válida para el usuario.")
        return <strong className="text-red-500">No se encontró una instancia válida.</strong>
    }

    // Si `MainReminders` espera una sola instancia, seleccionas la primera del array
    // Si espera el array, puedes pasar `resInstancia.data` directamente
    const instancia = resInstancia.data[0];

    /* Flag para comportamiento especifico del módulo de campañas */
    const isCampaignPage = false;

    return (
        <MainReminders
            isCampaignPage={isCampaignPage}
            user={user}
            apiKey={resApikey.data}
            reminders={reminders}
            leads={sessions}
            workflows={workflows}
            // CORRECCIÓN: Se pasa la primera instancia del array
            instancia={instancia}
        />
    )
}

export default RemindersPage