'use client'

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
import { FormModuleValues } from '@/schema/module'
import { SubmitHandler } from 'react-hook-form'

export function ModuleCreator({ onSave, openModule = false, setOpenModule }: {
    onSave: SubmitHandler<FormModuleValues>;
    openModule: boolean
    setOpenModule: (state: boolean) => void
}) {

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
                <ScrollArea className="max-h-[70vh] overflow-y-auto">
                    <ModuleForm onSubmit={onSave} />
                </ScrollArea>
                <DialogFooter>
                    <Button form="module-form" type="submit">Guardar módulo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}