'use client'

import { useState } from 'react'
import { NavLinkItem } from '@/constants/navLinks'
import { ModuleForm } from './'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { toast } from 'sonner'
import { FormModuleValues } from '@/schema/module'

export function ModuleCreator({ onSave }: { onSave: (module: NavLinkItem) => void }) {
    const [openModule, setOpenModule] = useState(false);

    const onSubmit = (data: FormModuleValues) => {
        toast.success(
            <>
                <p>Datos enviados:</p>
                <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                    <code className="text-white">{JSON.stringify(data, null, 2)}</code>
                </pre>
            </>
        )

        // Cerrar el diálogo
        setOpenModule(false)
    }

    return (
        <Dialog open={openModule} onOpenChange={setOpenModule}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpenModule(true)}>
                    Crear módulo
                </Button>
            </DialogTrigger>
            <DialogContent className="border-border">
                <DialogHeader>
                    <DialogTitle>Creación de módulos</DialogTitle>
                    <DialogDescription>
                        Este formulario está diseñado para la gestión de módulos. Es de suma importancia que el modulo exista antes de ser creado aquí
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] overflow-y-auto p-4">
                    <ModuleForm onSubmit={onSubmit} />
                </ScrollArea>
                <DialogFooter>
                    <Button form="module-form" type="submit">Guardar módulo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}