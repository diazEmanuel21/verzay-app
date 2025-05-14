"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { formValuesReminderSchema, reminderInterface, reminderSchema, repeatTypes } from "@/schema/reminder"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePicker, SelectComboBox, SelectWorkflowBox } from "@/components/custom"
import { createReminder, updateReminder } from "@/actions/reminders-actions"
import { useReminderDialogStore } from "@/stores"


export const ReminderForm = ({
    serverUrl,
    apikey,
    leads,
    workflows,
    onSuccess,
    initialData
}: reminderInterface) => {
    const router = useRouter();
    const { selectedReminderId: reminderId } = useReminderDialogStore();
    const isEdit = !!initialData

    const reminderForm = useForm<formValuesReminderSchema>({
        resolver: zodResolver(reminderSchema),
        defaultValues: initialData || {
            title: "",
            description: "",
            time: new Date(),
            repeatType: "NONE",
            repeatEvery: undefined,
            userId: "",
            remoteJid: "",
            instanceName: "",
            pushName: "",
            workflowId: "",
            apikey: "",
            serverUrl: "",
        }
    })

    const { register, handleSubmit, setValue, watch, formState: { errors } } = reminderForm;
    const initialLeadValue = initialData
        ? `${initialData.pushName || 'Sin nombre'} ${initialData.remoteJid.split('@')[0]}`
        : undefined;

    const initialWorkflowId = initialData?.workflowId;

    const mutation = useMutation({
        mutationFn: async (data: formValuesReminderSchema) => {
            return isEdit ? updateReminder(reminderId?.toString() ?? '', data) : createReminder(data)
        },
        onSuccess: (res) => {
            reminderForm.reset()
            if (!res.success) return toast.error(res.message)
            toast.success(res.message)
            router.refresh()
            if (onSuccess) onSuccess()
        },
        onError: () => {
            toast.error("Error inesperado al guardar recordatorio")
        }
    })

    useEffect(() => {
        setValue("apikey", apikey)
        setValue("serverUrl", serverUrl)
    }, [apikey, serverUrl])

    const onSubmit = (payload: formValuesReminderSchema) => mutation.mutate(payload)

    const onError = (errors: typeof reminderForm.formState.errors) => {
        const messages = Object.values(errors).map(err => err?.message).filter(Boolean)
        toast.error("Revisa los campos obligatorios", {
            description: (
                <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                    {messages.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
            )
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col gap-4 p-4">
            {/* Campos ocultos */}
            {["userId", "remoteJid", "instanceName", "pushName", "workflowId", "apikey", "serverUrl"].map((name) => (
                <input key={name} type="hidden" {...register(name as keyof formValuesReminderSchema)} />
            ))}

            <Input placeholder="Título" {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}

            <Textarea placeholder="Descripción" {...register("description")} />

            <DateTimePicker
                value={watch("time")}
                onChange={(val) => setValue("time", val)}
            />

            <div>
                <label className="block mb-1 font-medium">Tipo de Repetición</label>
                <Controller
                    control={reminderForm.control}
                    name="repeatType"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {repeatTypes.map((rt) => (
                                    <SelectItem key={rt.value} value={rt.value}>
                                        {rt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            <Input type="number" placeholder="Cada cuántos (días/meses...)" {...register("repeatEvery")} />

            <SelectComboBox
                leads={leads}
                onSelect={(lead) => {
                    setValue("userId", lead.userId, { shouldValidate: true })
                    setValue("remoteJid", lead.remoteJid, { shouldValidate: true })
                    setValue("instanceName", lead.instanceId, { shouldValidate: true })
                    setValue("pushName", lead.pushName, { shouldValidate: true })
                }}
                onLeadCreated={() => toast.info('Crear lead')}
                initialValue={initialLeadValue}
            />

            <SelectWorkflowBox
                workflows={workflows}
                onSelect={(workflow) => setValue("workflowId", workflow.id, { shouldValidate: true })}
                initialValue={initialWorkflowId}
            />

            <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear Recordatorio"}
            </Button>
        </form>
    )
}