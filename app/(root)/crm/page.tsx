import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainCrm } from './components';

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
        <MainCrm />
    );
};

export default CrmPage;