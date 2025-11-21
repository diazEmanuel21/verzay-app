// app/(dashboard)/crm/page.tsx
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainCrm } from './components/MainCrm';
import { db } from '@/lib/db';
import { LeadsManagement } from './components';

interface PageProps {
    params: { id?: string };
    searchParams: { [key: string]: string | string[] | undefined };
}

const CrmPage = async ({ params, searchParams }: PageProps) => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    }

    // const clientes = await db.cliente.findMany({
    //     where: { session: { userId: user.id } },
    //     include: {
    //         session: {
    //             include: {
    //                 registros: true,
    //             },
    //         },
    //     },
    //     orderBy: { createdAt: 'desc' },
    // });

    const sessions = await db.session.findMany({
        where: { userId: user.id },
        include: {
            registros: true,
            // cliente: true, // para saber si ya está vinculado a Cliente
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <>
            {/* <ClientManagement clientes={clientes} /> */}
            <LeadsManagement sessions={sessions} />
            {/* <SeedPage userId={user.id} /> */}
        </>
    );
};

export default CrmPage;
