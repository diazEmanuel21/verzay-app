'use client'

import { useForm } from 'react-hook-form'
import { AiCreatePromptProps, PromptAiFormValues, PromptAiSchema, TYPE_AI_LABELS } from '@/schema/ai'
import { zodResolver } from '@hookform/resolvers/zod'
import { TypePromptAi } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPromptAi, updatePromptAi } from '@/actions/ai-actions';

export const AiCreatePrompt = ({
    dialogOpen,
    editingId,
    setDialogOpen,
    setEditingId,
    defaultValues,
}: AiCreatePromptProps) => {
    const form = useForm<PromptAiFormValues>({
        resolver: zodResolver(PromptAiSchema),
        defaultValues: defaultValues || {
            title: '',
            message: '',
            typePrompt: TypePromptAi.TRAINING,
        },
    });

    const isEditing = !!editingId;

    const mutation = useMutation({
        mutationFn: async (data: PromptAiFormValues) => {

            if (isEditing) {
                return await updatePromptAi({ ...data, id: editingId! })
            } else {
                return await createPromptAi(data)
            }
        },
        onSuccess: () => {
            toast.success(isEditing ? 'Mensaje actualizado con éxito.' : 'Mensaje creado con éxito.')
            setDialogOpen(false)
            setEditingId(null)
        },
        onError: (error: any) => {
            console.error(error)
            toast.error('Ocurrió un error. Intenta nuevamente.')
        },
    })

    const onSubmit = (data: PromptAiFormValues) => {
        debugger;
        mutation.mutate(data)
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null) }}>
                    Crear
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl h-[600px] flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Mensaje' : 'Nuevo Mensaje'}</DialogTitle>
                    <DialogDescription>Completa los campos para personalizar tu IA</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form id={"ai-prompt-form"} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input maxLength={100} placeholder="Ejemplo: Bienvenida" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ejemplo: Saluda cordialmente al usuario y ofrece ayuda."
                                            className="flex-1 resize-none overflow-y-auto"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="typePrompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(TypePromptAi).map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {TYPE_AI_LABELS[cat]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={mutation.isPending} form="ai-prompt-form">
                                {mutation.isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}