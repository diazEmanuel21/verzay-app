"use client";

import { useState } from 'react';
import { User, Workflow } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Layers2Icon } from 'lucide-react';
import CustomDialogHeader from '@/components/shared/CustomDialogHeader';
import { CardCreateRr } from './';


interface AutoReplies {
    user: User;
    Workflows: Workflow[];
    triggerText: string;
};

export const CreateAutoReplies = ({ user, Workflows, triggerText = 'Crear' }: AutoReplies) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={(open) => {
            setOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button className='font-bold'>{(triggerText).toUpperCase()}</Button>
            </DialogTrigger>
            <DialogContent>
                <CustomDialogHeader
                    icon={Layers2Icon}
                    title="CREAR RESPUESTA RÁPIDA"
                    subTitle="Comienza a construir tu respuesta rápida"
                />
                <CardCreateRr
                    user={user}
                    Workflows={Workflows}
                />
            </DialogContent>
        </Dialog>
    )
}
