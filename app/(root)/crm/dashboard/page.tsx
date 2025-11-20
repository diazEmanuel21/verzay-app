// app/(dashboard)/crm/dashboard/page.tsx
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CrmDashboard } from "./components/CrmDashboard";

const CrmDashboardPage = async () => {
    const user = await currentUser();
    if (!user) redirect("/login");

    const registros = await db.registro.findMany({
        where: { session: { userId: user.id } },
        include: {
            session: {
                include: {
                    cliente: true,
                },
            },
        },
        orderBy: { fecha: "desc" },
    });

    return <CrmDashboard registros={registros} />;
};

export default CrmDashboardPage;
