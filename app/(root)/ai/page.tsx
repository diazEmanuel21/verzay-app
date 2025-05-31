import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainAi } from './_components';

interface PageProps {
    params: { id?: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

const AiPage = async ({ params, searchParams }: PageProps) => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    };

    return <MainAi userId={user.id}/>
};

export default AiPage;