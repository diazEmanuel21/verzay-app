// app/(root)/profile/page.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { MainAi } from '../ai/_components/MainAi';
import { Workflow } from '@prisma/client';
import { getWorkFlowByUser } from '@/actions/workflow-actions';
import { getOrCreatePrompt } from '@/actions/system-prompt-actions';

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data;
}

const ProfilePage = async () => {
    const user = await currentUser();
    if (!user) redirect('/login');

    const resWorkflow = await getWorkFlowByUser(user.id);
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : [];

    const prompt = await getOrCreatePrompt({ userId: user.id });

    // // 2) Secciones completas para hidratar tabs (especialmente Business)
    const sections = prompt.sections;

    // 3) Pasa meta + sections a MainAi
    return (
        <MainAi
            flows={workflows}
            user={user}
            promptMeta={{ id: prompt.id, version: prompt.version }}
            sections={prompt.sections as any}
        />
    );
};

export default ProfilePage;
