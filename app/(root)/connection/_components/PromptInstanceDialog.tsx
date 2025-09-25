'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PromptInstanciaFormValues, PromptInstanciaSchema } from "@/schema/ai";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createPromptInstancia, updatePromptInstancia } from "@/actions/prompt-actions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptInstancia } from "@prisma/client";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useRouter } from "next/navigation";

type PlatformConfig<T extends string> = {
    tabs: Record<T, string>;
    content: Record<T, string>;
    defaultTab: T;
};

const PLATFORM_CONFIG = {
    Instagram: {
        tabs: { comentarios: "Agente Comentarios", mensajes: "Agente Mensajes" },
        content: {
            comentarios: "Eres un agente de Instagram dedicado a responder comentarios.",
            mensajes: "Eres un agente de Instagram especializado en responder mensajes privados.",
        },
        defaultTab: "comentarios",
    },
    Facebook: {
        tabs: { comentarios: "Agente Publicaciones", mensajes: "Agente Mensajes" },
        content: {
            comentarios: "Eres un agente de Facebook dedicado a interactuar en publicaciones.",
            mensajes: "Eres un agente de Facebook especializado en responder por mensajes.",
        },
        defaultTab: "comentarios",
    },
    Whatsapp: {
        tabs: { mensajes: "Agente de mensajes" },
        content: {
            mensajes: "Eres un asistente virtual de WhatsApp configurado para responder preguntas y asistir a los usuarios de manera eficiente.",
        },
        defaultTab: "mensajes",
    },
} as const;

type PlatformType = keyof typeof PLATFORM_CONFIG;

interface PromptDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    prompts: PromptInstancia[] | undefined;
    userId: string;
    platform: PlatformType;
}

export const PromptInstanceDialog = ({ open, setOpen, prompts, userId, platform }: PromptDialogProps) => {
    const router = useRouter();

    // CORRECTED: Move all React Hooks to the top of the component
    const [activeTab, setActiveTab] = useState<string>(''); // Initialize with empty string or null
    const [allPrompts, setAllPrompts] = useState<Record<string, PromptInstanciaFormValues>>({});

    const form = useForm<PromptInstanciaFormValues>({
        resolver: zodResolver(PromptInstanciaSchema),
    });

    const { handleSubmit, getValues, setValue } = form;

    const mutation = useMutation({
        mutationFn: async (data: PromptInstanciaFormValues) => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });
            return data.id ? updatePromptInstancia(data.id, formData) : createPromptInstancia(formData);
        },
        onError: () => toast.error("Ocurrió un error al guardar el prompt."),
    });

    // CORRECTED: Now the conditional check can safely be here.
    const config = PLATFORM_CONFIG[platform];
    if (!config) return null;

    // Inicializa datos al abrir el modal SOLO una vez o cuando cambia la plataforma
    useEffect(() => {
        if (!open) return;

        const initialData: Record<string, PromptInstanciaFormValues> = {};
        Object.keys(config.tabs).forEach((tabKey) => {
            const existingPrompt = prompts?.find((p) => p.description === tabKey);
            initialData[tabKey] = {
                id: existingPrompt?.id,
                userId,
                tipoInstancia: platform,
                description: tabKey,
                contenido: existingPrompt?.contenido ?? config.content[tabKey as keyof typeof config.content],
            };
        });

        setAllPrompts(initialData);
        setActiveTab((prev) => prev || config.defaultTab);

        if (!Object.keys(allPrompts).length) {
            const first = initialData[config.defaultTab];
            setValue("id", first.id);
            setValue("userId", first.userId);
            setValue("tipoInstancia", first.tipoInstancia);
            setValue("description", first.description);
            setValue("contenido", first.contenido || "");
        }
    }, [open, platform, userId, setValue, config, prompts, allPrompts.length]); // CORRECTED: Added missing dependencies

    const handleTabChange = (newTab: string) => {
        const currentValues = getValues();
        const updatedPrompts = { ...allPrompts, [activeTab]: currentValues };
        setAllPrompts(updatedPrompts);
        setActiveTab(newTab);

        const selected = updatedPrompts[newTab];
        if (selected) {
            setValue("id", selected.id);
            setValue("userId", selected.userId);
            setValue("tipoInstancia", selected.tipoInstancia);
            setValue("description", selected.description);
            setValue("contenido", selected.contenido || "");
        }
    };

    const onSubmit = async () => {
        try {
            const currentValues = getValues();
            const updatedPrompts = { ...allPrompts, [activeTab]: currentValues };

            const results = await Promise.all(
                Object.values(updatedPrompts).map((p) => mutation.mutateAsync(p))
            );

            if (results.every((r) => r.success)) {
                toast.success("Todos los prompts se guardaron correctamente.");
                setOpen(false);
                router.refresh();
            } else {
                toast.error("Ocurrió un error al guardar uno o más prompts.");
            }
        } catch (err) {
            console.error("Error al guardar todos los prompts:", err);
            toast.error("Error inesperado al guardar.");
        }
    };

    const tabCount = Object.keys(config.tabs).length;
    const gridColsClass =
        tabCount === 1 ? "grid-cols-1" : tabCount === 2 ? "grid-cols-2" : "grid-cols-3";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="max-w-3xl w-[95vw] h-[85vh] p-6 flex flex-col justify-between border-border overflow-y-auto transition-all duration-300"
            >
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow">
                        <DialogHeader>
                            <DialogTitle className="text-center text-xl font-bold">
                                {prompts?.length ? "Editar Prompts" : "Crear Prompts"}
                            </DialogTitle>
                            <DialogDescription className="text-center text-base">
                                {prompts?.length
                                    ? "Modifica el contenido del prompt para tu agente."
                                    : "Crea un nuevo prompt para tu agente de IA."}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
                            <TabsList className={`w-full grid ${gridColsClass}`}>
                                {Object.entries(config.tabs).map(([key, label]) => (
                                    <TabsTrigger key={key} value={key}>
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="mt-4 flex-1">
                                <FormField
                                    control={form.control}
                                    name="contenido"
                                    render={({ field }) => (
                                        <FormItem className="h-full">
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Escribe el mensaje del agente..."
                                                    className="flex-1 resize-none overflow-y-auto min-h-[300px] h-full rounded-lg"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </Tabs>

                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={mutation.isPending} className="text-lg px-6 py-3">
                                {mutation.isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};