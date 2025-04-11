"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";

interface GenericDeleteDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    itemName: string;
    itemId: string | number;
    mutationFn: (id: string) => Promise<any>;
    entityLabel: string; // Ej: "Flujos", "respuesta rápida"
}

export function GenericDeleteDialog({
    open,
    setOpen,
    itemName,
    itemId,
    mutationFn,
    entityLabel,
}: GenericDeleteDialogProps) {
    const router =  useRouter();
    const [confirmText, setConfirmText] = useState("");

    const deleteMutation = useMutation({
        mutationFn,
        onSuccess: () => {
            toast.success(`${capitalize(entityLabel)} eliminado satisfactoriamente`, { id: itemId });
            setConfirmText("");
            router.refresh();
        },
        onError: () => {
            toast.error(`Hubo un error al eliminar el ${entityLabel}`, { id: itemId });
        }
    });

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Si eliminas este {entityLabel}, no podrás recuperarlo.
                    </AlertDialogDescription>
                    <div className="flex flex-col py-4 gap-2">
                        <p>
                            Escribe <b className="text-primary">{itemName}</b> para confirmar.
                        </p>
                        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={confirmText !== itemName || deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.loading(`Eliminando ${entityLabel}...`, { id: itemId });
                            deleteMutation.mutate(itemId.toString());
                        }}
                    >
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
