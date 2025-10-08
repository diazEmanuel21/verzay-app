import { ApiKey, Instancias, Reminders, Session, Workflow } from "@prisma/client"
import { currentUser } from '@/lib/auth';
import { getApiKeyById } from "@/actions/api-action"
import { getRemindersByUserId } from "@/actions/reminders-actions"
import { getSessionsByUserId } from "@/actions/session-action"
import { getWorkFlowByUser } from "@/actions/workflow-actions"
import { getInstancesByUserId } from "@/actions/instances-actions"
import { MainSchedule } from './_components';

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

// ✅ CORRECCIÓN: Actualiza el tipo para que coincida con lo que retorna la función.
// Ahora, `hasInstancia` comprueba si el array de instancias existe y no está vacío.
function hasInstancia(result: { data?: Instancias[] | null }): result is { data: Instancias[] } {
    return !!result.data && result.data.length > 0;
}

const SchedulePage = async ({ params }: { params: { userId: string } }) => {
    const user = await currentUser()
    if (!user) return null;

    // Obtener API Key
    const resApikey = await getApiKeyById(user.apiKeyId)
    if (!resApikey.success || !hasApiKey(resApikey)) {
        console.error("[SCHEDULE_PAGE] No se encontró una API Key válida para el usuario.")
        return <strong className="text-red-500">No se encontró una API Key válida.</strong>
    }

    // Obtener recordatorios
    const resReminder = await getRemindersByUserId(user.id)
    if (!resReminder.success) {
        console.error("[SCHEDULE_PAGE] Error al obtener recordatorios:", resReminder.message)
        return <strong>404</strong>
    }
    const reminders = hasReminder(resReminder) ? resReminder.data : []

    // Obtener sesiones
    const resSession = await getSessionsByUserId(user.id)
    if (!resSession.success) {
        console.error("[SCHEDULE_PAGE] Error al obtener sesiones:", resSession.message)
        return <strong>404</strong>
    }
    const sessions = hasSession(resSession) ? resSession.data : []

    // Obtener workflows
    const resWorkflow = await getWorkFlowByUser(user.id)
    if (!resWorkflow.success) {
        console.error("[SCHEDULE_PAGE] Error al obtener flujos de trabajo:", resWorkflow.message)
        return <strong>404</strong>
    }
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : []

    // ✅ CORRECCIÓN: Ahora se usa la función `hasInstancia` corregida.
    const resInstancia = await getInstancesByUserId(user.id)
    if (!resInstancia.success || !hasInstancia(resInstancia)) {
        console.error("[SCHEDULE_PAGE] No se encontró una instancia válida para el usuario.")
        return <strong className="text-red-500">No se encontró una instancia válida.</strong>
    }

    /* Flag para comportamiento especifico del módulo */
    const isCampaignPage = false;
    
    // ✅ CORRECCIÓN: Se selecciona la primera instancia del array.
    // Esto asume que el componente `MainSchedule` espera un solo objeto `Instancias`.
    const instancia = resInstancia.data[0];

    return (
        <MainSchedule
            isCampaignPage={isCampaignPage}
            user={user}
            apiKey={resApikey.data}
            reminders={reminders}
            leads={sessions}
            workflows={workflows}
            instancia={instancia}
        />
    );
};

export default SchedulePage;