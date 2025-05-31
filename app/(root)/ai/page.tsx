import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainAi } from './_components';
import { SystemMessage } from '@prisma/client';
import { getPromptAiByUserId } from '@/actions/ai-actions';

interface PageProps {
    params: { id?: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

function hasAiPrompt(result: { data?: SystemMessage[] }): result is { data: SystemMessage[] } {
    return !!result.data
};

const AiPage = async ({ params, searchParams }: PageProps) => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    };

    const resPromptAi = await getPromptAiByUserId(user.id);
    const promptAi = hasAiPrompt(resPromptAi) ? resPromptAi.data : null

    return <MainAi userId={user.id} promptAi={promptAi} />
};

export default AiPage;