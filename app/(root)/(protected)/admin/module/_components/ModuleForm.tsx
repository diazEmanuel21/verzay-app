"use client"

import { SubmitHandler, useFieldArray, useForm } from "react-hook-form"
import { Plan } from "@prisma/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { toast } from "sonner"
import type { CheckedState } from "@radix-ui/react-checkbox"
import { FormModuleSchema, FormModuleValues, iconMap } from "@/schema/module"
import { Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const ModuleForm = ({
    onSubmit,
    defaultValues,
}: {
    onSubmit: SubmitHandler<FormModuleValues>;
    defaultValues?: Partial<FormModuleValues>;
}) => {
    const plans: Plan[] = ["pymes", "empresarial", "business"];

    const form = useForm<FormModuleValues>({
        resolver: zodResolver(FormModuleSchema),
        defaultValues: {
            ...defaultValues,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    return (
        <Form {...form}>
            <form id="module-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del módulo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Leads" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="route"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ruta</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: /sessions" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Icono del módulo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un icono" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(iconMap).map(([key, IconComponent]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="w-4 h-4" />
                                                {key}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />


                {['showInSidebar', 'hiddenModuleToSelector', 'adminOnly', 'requiresPremium'].map((key) => (
                    <FormField
                        key={key}
                        control={form.control}
                        name={key as keyof z.infer<typeof FormModuleSchema>}
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-3">
                                <FormControl>
                                    <Checkbox
                                        checked={!!field.value}
                                        onCheckedChange={(checked: CheckedState) => field.onChange(!!checked)}
                                    />
                                </FormControl>
                                <FormLabel>{
                                    key === 'showInSidebar' ? 'Mostrar en Sidebar' :
                                        key === 'hiddenModuleToSelector' ? 'Ocultar módulo para reseller' :
                                            key === 'adminOnly' ? 'Solo Admin' : 'Requiere Premium'
                                }</FormLabel>
                            </FormItem>
                        )}
                    />
                ))}

                <FormField
                    control={form.control}
                    name="allowedPlans"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Planes permitidos:</FormLabel>
                            <div className="flex gap-4">
                                {plans.map((plan) => (
                                    <div key={plan} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={field.value?.includes(plan)}
                                            onCheckedChange={(checked: CheckedState) => {
                                                const current: Plan[] = field.value || [];
                                                const newPlans = current.includes(plan)
                                                    ? current.filter((p) => p !== plan)
                                                    : [...current, plan];
                                                field.onChange(newPlans);
                                            }}
                                        />
                                        <span className="text-sm capitalize">{plan}</span>
                                    </div>
                                ))}
                            </div>
                        </FormItem>
                    )}
                />

                <div className="space-y-4 flex justify-between items-center flex-wrap">
                    <FormLabel>Submódulos</FormLabel>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col md:flex-row gap-2 items-center">
                            <Input placeholder="URL" {...form.register(`items.${index}.url`)} />
                            <Input placeholder="Título" {...form.register(`items.${index}.title`)} />
                            <Button type="button" variant="destructive" onClick={() => remove(index)}>
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant={"outline"} onClick={() => append({ url: "", title: "" })}>
                        Agregar submódulo
                    </Button>
                </div>
            </form>
        </Form>
    )
}