import { MainReminders } from "./_components"
import { currentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getApiKeyById } from "@/actions/api-action"
import { ApiKey, Reminders } from "@prisma/client"
import { getRemindersByUserId } from "@/actions/reminders-actions"


function hasApiKey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
    return !!result.data
}

function hasReminder(result: { data?: Reminders[] }): result is { data: Reminders[] } {
    return !!result.data
}

const RemindersPage = async () => {
    const user = await currentUser()

    if (!user) redirect("/login")

    const resApikey = await getApiKeyById(user.apiKeyId);
    if (!hasApiKey(resApikey)) {
        console.error('No se encontró una Api Key asociada al usuario.')
        return <strong>Ups! parece que hubo un problema al realizar la petición.</strong>
    };

    const resReminder = await getRemindersByUserId(user.id);
    const reminders = hasReminder(resReminder) ? resReminder.data : []

    return <MainReminders user={user} apiKey={resApikey.data} reminders={reminders} />
}

export default RemindersPage
