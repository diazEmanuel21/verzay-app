import { currentUser } from '@/lib/auth';
import { GetWorkFlowforUser } from '@/actions/getWorkFlowforUser-action';
import { Workflow } from '@prisma/client';
import { Suspense } from 'react';
import { AutoRepliesContent, SkeletonAutoReplies } from './_components';

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data;
}

const AutoRepliesPage = async () => {

    const user = await currentUser();

    if (!user) {
        return <h1 className="text-center text-2xl font-bold mt-10">404 - Usuario no autorizado</h1>;
    }

    const resWorkflow = await GetWorkFlowforUser(user.id);
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : [];

    if (user) return <h1>En construcción...</h1>

    return (
        <Suspense fallback={<SkeletonAutoReplies />}>
            <AutoRepliesContent user={user} workflows={workflows} />
        </Suspense>
    );
};

export default AutoRepliesPage;
