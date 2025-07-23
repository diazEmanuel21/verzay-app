'use client'

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SwitchStatus } from "./SwitchStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/actions/session-action";
import { deleteConversationN8N } from "@/actions/n8n-chat-historial-action";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export type Session = {
  id: number;
  userId: string;
  remoteJid: string;
  pushName: string;
  instanceId: string;
  createdAt: Date;
  updatedAt: Date;
  status: boolean;
  seguimientos?: string | null;
  inactividad?: string | null;
};

function ActionsCell({ session, onDeleteSuccess }: { session: Session, onDeleteSuccess: (deletedId: number) => void }) {
  const [openDeleteCliente, setOpenDeleteCliente] = useState(false);
  const [openDeleteHistorial, setOpenDeleteHistorial] = useState(false);

  const handleDeleteCliente = async () => {
    try {
      const sessionRes = await deleteSession(session.userId, session.id, session.remoteJid);
      if (!sessionRes.success) {
        toast.error(sessionRes.message || "Error al eliminar sesión.");
        return;
      }
      const conversationRes = await deleteConversationN8N(session.userId, session.id, session.remoteJid);
      if (!conversationRes.success) {
        toast.warning(conversationRes.message || "Sesión eliminada pero historial no encontrado.");
      }
      toast.success("Cliente eliminado correctamente.");
      onDeleteSuccess(session.id);
    } catch (error) {
      toast.error("Error inesperado al eliminar cliente.");
      console.error(error);
    }
  };

  const handleDeleteHistorial = async () => {
    try {
      const conversationRes = await deleteConversationN8N(session.userId, session.id, session.remoteJid);
      if (conversationRes.success) {
        toast.success("Historial eliminado correctamente.");
      } else {
        toast.error(conversationRes.message || "Error al eliminar historial.");
      }
    } catch (error) {
      toast.error("Error inesperado al eliminar historial.");
      console.error(error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpenDeleteHistorial(true);
            }}
            className="text-red-600"
          >
            Eliminar historial
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpenDeleteCliente(true);
            }}
            className="text-red-600"
          >
            Eliminar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openDeleteHistorial} onOpenChange={setOpenDeleteHistorial}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar historial?</AlertDialogTitle>
            <AlertDialogDescription>Eliminará solo el historial de conversación.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteHistorial}
            >
              Eliminar historial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openDeleteCliente} onOpenChange={setOpenDeleteCliente}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
            <AlertDialogDescription>Eliminará la sesión y su historial. ¿Deseas continuar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteCliente}
            >
              Eliminar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Columns corregido ---
export const columns = ({ onDeleteSuccess, mutateSessions }: { onDeleteSuccess: (deletedId: number) => void, mutateSessions: () => void }): ColumnDef<Session>[] => [
  {
    accessorKey: "remoteJid",
    header: "Celular",
    cell: ({ row }) => {
      const remoteJid = row.getValue("remoteJid") as string;
      const phone = remoteJid.split('@')[0];
      return <div className="capitalize">{phone}</div>;
    },
  },
  {
    accessorKey: "pushName",
    header: "Nombre",
    cell: ({ row }) => <div>{row.getValue("pushName") || "Sin nombre"}</div>,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as boolean;
      const sessionId = row.original.id;
      return <SwitchStatus checked={status} sessionId={sessionId} mutateSessions={mutateSessions} />;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Creado",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleString(),
  },
  {
    accessorKey: "seguimientos",
    header: "Flujos",
    cell: ({ row }) => <div>{row.getValue("seguimientos") || "-"}</div>,
  },
  // {
  //   accessorKey: "flujos",
  //   header: "Seguimientos",
  //   cell: ({ row }) => <div>{row.getValue("flujos") || "-"}</div>,
  // },
  {
    accessorKey: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <ActionsCell session={row.original} onDeleteSuccess={onDeleteSuccess} />
    ),
  },
];
