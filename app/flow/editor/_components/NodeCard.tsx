"use client";

import React, { useState, useTransition } from "react";
import { WorkflowNode } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@radix-ui/react-separator";
import { PlusIcon, TrashIcon, MessageSquareIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateNode, deleteNode } from "@/actions/createNode"; // Importa tu acción de actualización

interface Props {
  workflowId: string;
  nodes: WorkflowNode;
}

function NodeCard({nodes, workflowId}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(nodes.message);
  const [isPending, startTransition] = useTransition(); // Manejo de transición
  const [isDeleting, setIsDeleting] = useState(false); // Estado de eliminación

  const handleSave = () => {
    if (message !== nodes.message) {
      startTransition(async () => {
        try {
          await updateNode(nodes.id, message);
        } catch (error) {
          console.error("Error actualizando el nodo:", error);
        }
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNode(nodes.id, workflowId);
      console.log("Nodo eliminado exitosamente");
      // Aquí puedes agregar lógica adicional, como actualizar el estado del componente padre.
    } catch (error) {
      console.error("Error eliminando el nodo:", error);
    } finally { 
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4 text-left">
          {isEditing ? (
            <textarea
              className="w-full px-2 py-1 border rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={handleSave} // Guardar al perder el foco
              rows={3}
              autoFocus
              disabled={isPending}
            />
          ) : (
            <span
              className="flex items-start gap-2 text-xl cursor-pointer hover:underline whitespace-pre-wrap border border-gray-300 rounded p-2"
              onClick={() => setIsEditing(true)}
            >
              <MessageSquareIcon className="w-5 h-5 text-gray-500" />
              {message}
            </span>
          )}
          <Badge>{nodes.tipo}</Badge>
        </CardTitle>
      </CardHeader>

      <CardFooter className="flex flex-col gap-2 mt-2">
        <footer className="flex items-center justify-between h-10 px-4 text-xs text-neutral-500">
          <p>Creado el {nodes.createdAt.toLocaleDateString()}</p>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" disabled={isDeleting}>
                  <TrashIcon />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <p className="text-sm">¿Estás seguro de que deseas eliminar este nodo?</p>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </footer>
        <Separator />
      </CardFooter>
    </Card>
  );
};

export default NodeCard;
