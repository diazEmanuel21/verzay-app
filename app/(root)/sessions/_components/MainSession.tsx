'use client';
import { useRouter } from 'next/navigation';
import { Session } from '@prisma/client';
import { getColumns } from './Columns';
import { DataGrid } from './DataGrid';
import { toast } from 'sonner';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteSession } from '@/actions/session-action';

interface SessionData {
    sessionId: number, remoteJid: string, userId: string
}

export function MainSession({ sessions }: { sessions: Session[] }) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<SessionData | null>(null);


    const handleDeleteClient = (sessionId: number, remoteJid: string, userId: string) => {
        if (!remoteJid) {
            toast.error('Sesión no encontrada.');
            return;
        }
        setSessionToDelete({ sessionId, remoteJid, userId });
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;

        const toastId = 'delete-client';
        toast.loading('Eliminando cliente...', { id: toastId });

        try {
            const result = await deleteSession(
                sessionToDelete.userId,
                sessionToDelete.sessionId,
                sessionToDelete.remoteJid);

            if (result) {
                toast.success('Cliente eliminado correctamente', { id: toastId });
                router.refresh();
            } else {
                toast.error('Error al eliminar el cliente', { id: toastId });
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado', { id: toastId });
            console.error('Error deleting session:', error);
        } finally {
            setSessionToDelete(null);
            setShowConfirm(false);
        }
    };

    const columns = getColumns(handleDeleteClient);

    return (
        <>
            <DataGrid<Session, unknown> columns={columns} data={sessions} />

            <AlertDialog open={showConfirm} onOpenChange={(open) => {
                if (!open) {
                    setSessionToDelete(null);
                }
                setShowConfirm(open);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no puede deshacerse. Esto eliminará permanentemente los datos
                            del cliente de nuestros servidores.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}