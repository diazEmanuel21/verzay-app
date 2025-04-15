'use server'

import { currentUser } from "@/lib/auth"
import { MainReseller } from "./_components"
import { db } from "@/lib/db"

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const ResellerPage = async ({ searchParams }: Props) => {
    const user = await currentUser()

    // Verificación de permisos
    if (!user || user.role !== "admin") {
        return <div>Lo sentimos, este portal solo está hecho para distribuidores.</div>
    }

    // Obtener revendedores
    const resellers = await db.user.findMany({
        where: { role: "reseller" },
    })

    // Si no hay revendedores, evita errores en el componente
    if (!resellers.length) {
        return <div>No hay revendedores registrados aún.</div>
    }

    const defaultResellerId = resellers[0].id

    return (
        <MainReseller
            searchParams={searchParams}
            user={user}
            resellers={resellers}
            defaultResellerId={defaultResellerId}
        />
    )
}

export default ResellerPage
