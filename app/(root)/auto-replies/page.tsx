import { currentUser } from '@/lib/auth';
import { GetWorkFlowforUser } from '@/actions/getWorkFlowforUser-action';
import { rr, Workflow } from '@prisma/client';
import { Suspense } from 'react';
import { AutoRepliesContent, SkeletonAutoReplies } from './_components';
import { getAllRRs } from '@/actions/rr-actions';

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data;
}

function hasAutoReplies(result: { data?: rr[] }): result is { data: rr[] } {
    return !!result.data;
}

const AutoRepliesPage = async () => {
    const user = await currentUser();

    if (!user) {
        return <h1 className="text-center text-2xl font-bold mt-10">404 - Usuario no autorizado</h1>;
    }

    const resWorkflow = await GetWorkFlowforUser(user.id);
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : [];

    const resAutoReplies = await getAllRRs(user.id);
    const autoReplies = hasAutoReplies(resAutoReplies) ? resAutoReplies.data : [];

    return (
        <Suspense fallback={<SkeletonAutoReplies />}>
            <AutoRepliesContent user={user} workflows={workflows} autoReplies={autoReplies}/>
        </Suspense>
    );
};

export default AutoRepliesPage;
