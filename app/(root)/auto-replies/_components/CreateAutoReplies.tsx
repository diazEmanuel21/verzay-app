"use client";

import { useState } from 'react';
import { User, Workflow } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Layers2Icon } from 'lucide-react';
import CustomDialogHeader from '@/components/shared/CustomDialogHeader';
import { CardCreateRr } from './';
import { GenericEditDialog } from '@/components/shared/GenericEditDialog';


interface AutoReplies {
    user: User;
    Workflows: Workflow[];
    triggerText: string;
};

export const CreateAutoReplies = ({ user, Workflows, triggerText = 'Crear' }: AutoReplies) => {
    const [open, setOpen] = useState(false);

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
