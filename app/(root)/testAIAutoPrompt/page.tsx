import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { MainAi } from '../ai/_components/MainAi';

const ProfilePage = async () => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    };


    return (
        <>
            <MainAi />
        </>
    );
}

export default ProfilePage;