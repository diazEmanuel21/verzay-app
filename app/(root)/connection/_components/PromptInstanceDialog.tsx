'use client'

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PromptAiFormValues, PromptAiSchema } from "@/schema/ai";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createPromptAi, updatePromptAi } from "@/actions/ai-actions";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PromptDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    defaultValues?: PromptAiFormValues | null;
    userId: string;
    instanceType: string;
}

const INSTAGRAM_TABS = {
    comments: 'Agente Comentarios',
    messages: 'Agente Mensajes',
};

const AGENT_CONTENT = {
    comments: 'Eres un agente de Instagram dedicado a responder comentarios.',
    messages: 'Eres un agente de Instagram especializado en responder mensajes privados.',
};

export const PromptInstanceDialog = ({ open, setOpen, defaultValues, userId,instanceType }: PromptDialogProps) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<keyof typeof INSTAGRAM_TABS>('comments');
    const [agentContent, setAgentContent] = useState(AGENT_CONTENT);

    const form = useForm<PromptAiFormValues>({
        resolver: zodResolver(PromptAiSchema),
        defaultValues: defaultValues || {
            message: AGENT_CONTENT.comments,
            userId,
            typePrompt: 'TRAINING',
        },
    });

    const { reset, handleSubmit, setValue } = form;

    useEffect(() => {
        if (open) {
            reset({
                ...defaultValues,
                message: agentContent[activeTab],
            });
        }
    }, [open, defaultValues, reset, agentContent, activeTab]);

    const isEditing = !!defaultValues?.id;

    const mutation = useMutation({
        mutationFn: async (data: PromptAiFormValues) => {
            if (isEditing) return await updatePromptAi({ ...data, id: defaultValues!.id });
            return await createPromptAi(data);
        },
        onSuccess: () => {
            toast.success(isEditing ? 'Mensaje actualizado con éxito.' : 'Mensaje creado con éxito.');
            setOpen(false);
            router.refresh();
        },
        onError: () => {
            toast.error("Ocurrió un error. Intenta nuevamente.");
        },
    });

    const onSubmit = () => {
        // Enviar el contenido de la pestaña activa a la API
        const data: PromptAiFormValues = {
            title: activeTab, // Usar la clave de la pestaña como título
            message: agentContent[activeTab],
            userId,
            typePrompt: 'TRAINING', // O el valor que corresponda
        };
        mutation.mutate(data);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value as keyof typeof INSTAGRAM_TABS);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md h-[400px] flex flex-col border-border">
                <DialogHeader>
                    <DialogTitle className="text-center">Configuración </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="comments">
                            {INSTAGRAM_TABS.comments}
                        </TabsTrigger>
                        <TabsTrigger value="messages">
                            {INSTAGRAM_TABS.messages}
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4 flex flex-col h-full">
                        <Textarea
                            placeholder="Escribe el mensaje del agente..."
                            className="flex-1 resize-none overflow-y-auto"
                            value={agentContent[activeTab]}
                            onChange={(e) => setAgentContent({ ...agentContent, [activeTab]: e.target.value })}
                        />
                    </div>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button type="button" onClick={onSubmit} disabled={mutation.isPending}>
                        {mutation.isPending ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};