'use client';

import React, { useState, useTransition } from "react";
import { WorkflowNode } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

import {
  TrashIcon,
  MessageSquareIcon,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Music,
} from "lucide-react";

import { workflowActions } from "./Node";
import { updateNode, deleteNode } from "@/actions/createNode";
import { toast } from "sonner";

interface Props {
  workflowId: string;
  nodes: WorkflowNode;
}

function NodeCard({ nodes, workflowId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(nodes.message);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const handleSave = () => {
    if (message !== nodes.message) {
      startTransition(async () => {
        try {
          await updateNode(nodes.id, message);
        } catch (error) {
          toast.error(`Error actualizando el nodo:", ${error}`);
        }
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNode(nodes.id, workflowId);
      toast.success('Nodo eliminado exitosamente.');
    } catch (error) {
      toast.error(`Error eliminando el nodo:", ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleCancelUpload = () => {
    setFile(null);
    setPreviewURL(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('No hay archivo seleccionado');
      return;
    }

    const toastLoading = toast.loading('Subiendo archivo...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log(data);

      if (res.ok) {
        toast.success('Archivo subido con éxito', { id: toastLoading });
        setPreviewURL(data.url);
        // Aquí puedes guardar la URL en el nodo si quieres
      } else {
        toast.error(data.error || 'Error al subir', { id: toastLoading });
      }
    } catch (error) {
      toast.error(`Error al subir el archivo'${error}`, { id: toastLoading });
    }
  };

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
            {nodes.tipo.toLowerCase() === 'texto' ? (
              isEditing ? (
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
              )
            ) : (
              <div className="flex flex-col gap-4 w-full">
                {/* Input file */}
                <Input
                  type="file"
                  accept={nodes.tipo.toLowerCase() === 'imagen'
                    ? 'image/*'
                    : nodes.tipo.toLowerCase() === 'video'
                      ? 'video/*'
                      : nodes.tipo.toLowerCase() === 'audio'
                        ? 'audio/*'
                        : '*'}
                  onChange={handleFileChange}
                />

                {/* Preview del archivo */}
                {previewURL && (
                  <div className="w-full border border-border rounded-md p-3 bg-muted">
                    {nodes.tipo.toLowerCase() === 'imagen' && (
                      <img src={previewURL} alt="Preview" className="rounded-md w-full h-auto" />
                    )}

                    {nodes.tipo.toLowerCase() === 'video' && (
                      <video src={previewURL} controls className="rounded-md w-full h-auto" />
                    )}

                    {nodes.tipo.toLowerCase() === 'audio' && (
                      <audio src={previewURL} controls className="w-full" />
                    )}

                    {nodes.tipo.toLowerCase() === 'archivo/documento' && (
                      <div className="text-sm text-muted-foreground">
                        Archivo listo para subir: {file?.name}
                      </div>
                    )}
                  </div>
                )}

                {/* Botones */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelUpload}
                    disabled={!file}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!file}
                  >
                    Subir Archivo
                  </Button>
                </div>
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
                {/* Properly use AlertDialogTitle as a component */}
                <AlertDialogTitle>Eliminar nodo</AlertDialogTitle>
                <AlertDialogDescription>
                  <p className="text-sm">¿Estás seguro de que deseas eliminar este nodo?</p>
                </AlertDialogDescription>
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