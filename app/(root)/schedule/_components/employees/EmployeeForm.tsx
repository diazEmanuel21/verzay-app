"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrUpdateEmployee } from "@/actions/employees-actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmployeeFormProps, employeeSchema, FormData } from "@/types/employees";

export function EmployeeForm({ open, setOpen, userId, employee }: EmployeeFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: employee || {
            userId,
            name: "",
            role: "",
            email: "",
            phone: "",
            timezone: "America/Bogota",
            isActive: true,
        },
    });

    const onSubmit = async (values: FormData) => {
        startTransition(async () => {
            const res = await createOrUpdateEmployee({
                ...values,
                id: employee?.id,
                userId,
            });
            if (res.success) {
                toast.success(employee ? "Empleado actualizado" : "Empleado creado");
                setOpen(false);
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{employee ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div>
                        <Label>Nombre</Label>
                        <Input {...form.register("name")} />
                    </div>

                    <div>
                        <Label>Cargo</Label>
                        <Input {...form.register("role")} />
                    </div>

                    <div>
                        <Label>Correo</Label>
                        <Input type="email" {...form.register("email")} />
                    </div>

                    <div>
                        <Label>Teléfono</Label>
                        <Input {...form.register("phone")} />
                    </div>

                    <div>
                        <Label>Zona horaria</Label>
                        <Input {...form.register("timezone")} />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Label>Activo</Label>
                        <Switch
                            checked={form.watch("isActive")}
                            onCheckedChange={(val) => form.setValue("isActive", val)}
                        />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full mt-4">
                        {isPending ? "Guardando..." : "Guardar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}