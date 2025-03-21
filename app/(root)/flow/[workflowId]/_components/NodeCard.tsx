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
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TrashIcon,
  MessageSquareIcon,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Music,
} from "lucide-react";
workflowActions
import { workflowActions } from "./Node";
import { updateNode, deleteNode } from "@/actions/createNode";

interface Props {
  workflowId: string;
  nodes: WorkflowNode;
}

function NodeCard({ nodes, workflowId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(nodes.message);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch (error) {
      console.error("Error eliminando el nodo:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Obtener el ícono y color basado en el tipo
  const currentAction = workflowActions.find(
    (action) => action.label.toLowerCase() === nodes.tipo.toLowerCase()
  );

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Badge tipo de mensaje */}
      <div className="absolute -top-4 left-4 flex items-center space-x-2 bg-background border border-border rounded-md px-3 py-1 shadow-md">
        {currentAction?.icon || (
          <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {nodes.tipo || "Tipo desconocido"}
        </span>
      </div>

      {/* Card principal */}
      <Card className="shadow-md border border-border rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-4 text-left text-lg">
            {isEditing ? (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={handleSave}
                rows={3}
                autoFocus
                disabled={isPending}
                className="w-full p-2 border border-border rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <div
                className="flex items-start gap-2 text-base cursor-pointer hover:underline whitespace-pre-wrap border border-muted-foreground/20 rounded-md p-3 bg-muted transition"
                onClick={() => setIsEditing(true)}
              >
                <MessageSquareIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{message}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground px-4 py-3">
          <p className="italic">Creado el {nodes.createdAt.toLocaleDateString()}</p>

          <div className="flex items-center gap-2">
            {/* Eliminar nodo */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" disabled={isDeleting}>
                  <TrashIcon className="h-4 w-4" />
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
        </CardFooter>
      </Card>
    </div>
  );
}

export default NodeCard;