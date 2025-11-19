import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainCrm } from './components';
import { SeedPage } from './components/SeedPage';

interface PageProps {
    params: { id?: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

const CrmPage = async ({ params, searchParams }: PageProps) => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    };


    return (
        <>
            <MainCrm />
            {/* <SeedPage userId={user.id} /> */}
        </>
    );
};

export default CrmPage;