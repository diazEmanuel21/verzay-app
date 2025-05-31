
'use client'

import { useForm } from 'react-hook-form'
import { AiCreatePromptProps, AiFormInterface, PromptAiFormValues, PromptAiSchema, TYPE_AI_LABELS } from '@/schema/ai'
import { zodResolver } from '@hookform/resolvers/zod'
import { TypePromptAi } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'

export const AiForm = ({ onSubmit, defaultValues }: AiFormInterface) => {
    const form = useForm<PromptAiFormValues>({
        resolver: zodResolver(PromptAiSchema),
        defaultValues: defaultValues || {
            title: '',
            message: '',
            typePrompt: TypePromptAi.TRAINING,
        },
    })

    return (
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
            </form>
        </Form>
    )
}