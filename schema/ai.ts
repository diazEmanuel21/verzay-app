import { SystemMessage, TypePromptAi } from "@prisma/client";
import { SubmitHandler } from "react-hook-form";
import { z } from "zod";

export const TYPE_AI_LABELS: Record<TypePromptAi, string> = {
    [TypePromptAi.TRAINING]: 'Entrenamiento',
    [TypePromptAi.FAQs]: 'Preguntas frecuentes',
    [TypePromptAi.ACTIONS]: 'Acciones',
    [TypePromptAi.DATA_CAPTURE]: 'Captura de datos',
    [TypePromptAi.DATA_QUERY]: 'Consulta de Datos',
};

export const PromptAiSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'El título es obligatorio'),
    message: z.string().min(1, 'La descripción es obligatoria'),
    userId: z.string().min(1, 'El usuario es obligatorio'),
    typePrompt: z.nativeEnum(TypePromptAi),
});
export interface FormPromptAiProps {
    promptAi: SystemMessage[] | null
    userId: string
};
export interface AiCreatePromptProps {
    userId: string
    dialogOpen: boolean
    editingId: string | null
    setDialogOpen: (open: boolean) => void
    defaultValues?: Partial<PromptAiFormValues>;
    openCreateDialog: () => void
};
export interface AiFormInterface {
    onSubmit: SubmitHandler<PromptAiFormValues>;
    defaultValues?: Partial<PromptAiFormValues>;
}
export interface PromptTabsProps {
    messages: SystemMessage[]
    debouncedSearchTerm?: string
    highlightMatch: (text: string, search: string) => React.ReactNode
    truncateMessage: (text: string, length: number) => string
    openEditDialog: (msg: SystemMessage) => void
};

export type PromptAiFormValues = z.infer<typeof PromptAiSchema>