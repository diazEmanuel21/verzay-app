import { MainReminders } from "./_components"
import { currentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getApiKeyById } from "@/actions/api-action"
import { ApiKey } from "@prisma/client"

function hasApiKey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
    return !!result.data
}

const RemindersPage = async () => {
    const user = await currentUser()

    if (!user) redirect("/login")

    const resApikey = await getApiKeyById(user.apiKeyId);
    console.log(resApikey)
    if (!hasApiKey(resApikey)) {
        console.error('No se encontró una Api Key asociada al usuario.')
        return <strong>Ups! parece que hubo un problema al realizar la petición.</strong>
    };

    return <MainReminders user={user} apiKey={resApikey.data} />
}

export default RemindersPage
