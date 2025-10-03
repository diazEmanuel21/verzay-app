import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { MainAi } from '../ai/_components/MainAi';
import { Workflow } from '@prisma/client';
import { getWorkFlowByUser } from '@/actions/workflow-actions';

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data;
}

const ProfilePage = async () => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    };

    const resWorkflow = await getWorkFlowByUser(user.id);
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : [];

    return (
        <>
            <MainAi flows={workflows} user={user}/>
        </>
    );
}

export default ProfilePage;