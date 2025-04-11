import { User, Workflow } from '@prisma/client';

import { Layers2Icon } from 'lucide-react';
import { CardCreateRr } from './';
import { GenericEditDialog } from '@/components/shared/GenericEditDialog';

interface AutoReplies {
    user: User;
    Workflows: Workflow[];
    triggerText: string;
};

export const CreateAutoReplies = ({ user, Workflows, triggerText = 'Crear' }: AutoReplies) => {

    return (
        <GenericEditDialog
            icon={Layers2Icon}
            title="CREAR RESPUESTA RÁPIDA"
            subTitle="Comienza a construir tu respuesta rápida"
            triggerText={triggerText}
        >
            <CardCreateRr
                user={user}
                Workflows={Workflows}
            />
        </GenericEditDialog>
    )
}
