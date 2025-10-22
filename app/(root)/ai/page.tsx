import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SystemMessage } from '@prisma/client';
import { getPromptAiByUserId } from '@/actions/ai-actions';
import { MessagesSkeleton } from './_components/OldPromptAi';
import { MainAi } from './_components/OldPromptAi/MainAi';

interface PageProps {
    params: { id?: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

function hasAiPrompt(result: { data?: unknown }): result is { data: SystemMessage[] } {
  return Array.isArray(result.data);
}

const AiPage = async ({ params, searchParams }: PageProps) => {
    const user = await currentUser();

    if (!user) {
        redirect('/login');
    };

    const resPromptAi = await getPromptAiByUserId(user.id);
    const promptAi = Array.isArray(resPromptAi.data) ? resPromptAi.data : [];

    return (
        <Suspense fallback={<MessagesSkeleton />}>
            <MainAi promptAi={promptAi} userId={user.id} />
        </Suspense>
    );
};

export default AiPage;