'use client';

import { User, Workflow } from '@prisma/client';
import { MainAutoReplies } from './MainAutoReplies';

interface Props {
    user: User;
    workflows: Workflow[];
}

export const AutoRepliesContent = ({ user, workflows }: Props) => {
    if (workflows.length === 0) {
        return <h1 className="text-center text-xl mt-6 text-muted-foreground">No se encontraron flujos asociados al usuario.</h1>;
    }

    return <MainAutoReplies user={user} Workflows={workflows} />;
};
