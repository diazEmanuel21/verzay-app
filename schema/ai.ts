import { SystemMessage, TypePromptAi } from "@prisma/client";
import { SubmitHandler } from "react-hook-form";
import { z } from "zod";


export const TYPE_AI_LABELS: Record<TypePromptAi, string> = {
    [TypePromptAi.TRAINING]: 'Entrenamiento',
    [TypePromptAi.FAQs]: 'Preguntas frecuentes',
    [TypePromptAi.ACTIONS]: 'Acciones',
}
export const PromptAiSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'El título es obligatorio'),
    message: z.string().min(1, 'La descripción es obligatoria'),
    userId: z.string().min(1, 'El usuario es obligatorio'),
    typePrompt: z.nativeEnum(TypePromptAi),
});
export interface FormPromptAiProps {
    userId: string;
    promptAi: SystemMessage[] | null
};
export interface AiCreatePromptProps {
    loading: boolean
    dialogOpen: boolean
    editingId: string | null
    setDialogOpen: (open: boolean) => void
    setEditingId: (id: string | null) => void
    onSubmit: SubmitHandler<PromptAiFormValues>;
    defaultValues?: PromptAiFormValues
};
export interface PromptTabsProps {
    messages: SystemMessage[]
    debouncedSearchTerm?: string
    highlightMatch: (text: string, search: string) => React.ReactNode
    truncateMessage: (text: string, length: number) => string
    openEditDialog: (msg: SystemMessage) => void
    confirmDelete: (id: string) => void
    loading?: boolean
};

export type PromptAiFormValues = z.infer<typeof PromptAiSchema>