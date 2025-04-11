import { rr, User, Workflow } from '@prisma/client';
import { MainAutoReplies } from './MainAutoReplies';
import { UserWorkflows } from '../../flow/page';

interface Props {
    user: User;
    workflows: Workflow[];
    autoReplies: rr[];
}

export const AutoRepliesContent = ({ user, workflows, autoReplies }: Props) => {
    if (workflows.length === 0) {
        return <UserWorkflows userId={user.id} />;
    }

    return <MainAutoReplies user={user} Workflows={workflows} autoReplies={autoReplies} />;
};
