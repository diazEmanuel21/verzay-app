'use client';

import React, { useState, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { User, WorkflowNode } from "@prisma/client";
import { CreateNodeComponent } from "./";
import { updateNode, deleteNode, updateUrlNode } from "@/actions/createNode";
import { actions, optimizeFile, validateFileType } from "../helpers";
import { Action } from "../types";
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

import { toast } from "sonner";
import {
  TrashIcon,
  MessageSquareIcon,
  UploadIcon,
} from "lucide-react";
interface Props {
  workflowId: string;
  nodes: WorkflowNode;
  user: User;
}

export const NodeCard = ({ nodes, workflowId, user }: Props) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(nodes.message);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(nodes.createdAt));

  const nodeType = nodes.tipo?.toLowerCase() as Action['type'];
  const hasContent = nodeType === 'text' ? !!message : !!nodes.url;
  const currentAction = actions.find(
    (action) => action.type.toLowerCase() === nodeType
  );

  const handleSave = () => {
    if (message !== nodes.message) {
      startTransition(async () => {
        try {
          await updateNode(nodes.id, message);
          toast.success('Mensaje actualizado correctamente');
        } catch (error) {
          toast.error(`Error actualizando el nodo: ${error}`);
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
      toast.error(`Error eliminando el nodo: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!validateFileType(selectedFile, nodeType)) {
        toast.error(`Tipo de archivo no válido. Se esperaba: ${nodeType === 'image'
          ? 'image (JPEG, PNG, GIF)'
          : nodeType === 'video'
            ? 'video (MP4, WebM)'
            : nodeType === 'audio'
              ? 'audio (MP3, WAV)'
              : 'documento (PDF, DOC)'}`);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleCancelUpload = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('No hay archivo seleccionado');
      return;
    }

    setIsUploading(true);
    const toastLoading = toast.loading('Subiendo archivo...');
    const nodeTypeIsImage = nodeType === 'image';
    let blob;

    try {
      if (nodeTypeIsImage) {
        // 1. Optimizar el archivo (manejo correcto del tipo)
        const content = await file.arrayBuffer();
        const plainFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          content: Array.from(new Uint8Array(content)) // lo convertimos en array serializable
        };

        const optimizedFile = await optimizeFile(plainFile);
        let optimizedBuffer;

        optimizedBuffer = new Uint8Array(optimizedFile.buffer);
        blob = new Blob([optimizedBuffer], { type: optimizedFile.type });
      };
      // else {
      //   optimizedBuffer = new Uint8Array(optimizedFile.content);
      //   blob = new Blob([optimizedBuffer], { type: optimizedFile.type });
      // }

      // 2. Crear FormData
      const formData = new FormData();
      formData.append('file', (nodeTypeIsImage ? blob : file) as Blob); // usamos el blob optimizado para imagen
      formData.append('file', file);
      formData.append('userID', user.id);
      formData.append('workflowID', workflowId);

      // 3. Subir a la API
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const { url } = await res.json();

      // 4. Actualizar nodo
      const result = await updateUrlNode(nodes.id, url);
      if (!result.success) throw new Error(result.message);

      toast.success(result.message, { id: toastLoading });
      router.refresh();

    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al subir el archivo',
        { id: toastLoading }
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* Drag and drop events */
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!validateFileType(droppedFile, nodeType)) {
        toast.error(`Tipo de archivo no válido. Se esperaba: ${nodeType === 'image'
          ? 'image'
          : nodeType === 'video'
            ? 'video'
            : nodeType === 'audio'
              ? 'audio'
              : 'documento'}`);
        return;
      }
      setFile(droppedFile);
    }
  };

  const renderContent = () => {
    if (nodeType === "delaymsg") return (
      <div className="flex items-center flex-col w-full">
        <CreateNodeComponent workflowId={workflowId} />
      </div>
    );

    if (nodeType === 'text') {
      return isEditing ? (
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
      );
    }

    // Para tipos de archivo (image, video, audio, documento)
    if (hasContent) {
      return (
        <div className="w-full border border-border rounded-md p-3 bg-muted">
          {nodeType === 'image' && (
            <img src={nodes.url!} alt="Contenido del nodo" className="rounded-md w-full h-auto max-h-64 object-contain" />
          )}
          {nodeType === 'video' && (
            <video src={nodes.url!} controls className="rounded-md w-full h-auto max-h-64" />
          )}
          {nodeType === 'audio' && (
            <audio src={nodes.url!} controls className="w-full" />
          )}
          {nodeType === 'document' && (
            <div className="flex items-center gap-2 p-2 bg-background rounded">
              <a
                href={nodes.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Ver documento
              </a>
            </div>
          )}

        </div>
      );
    }

    // Si no hay contenido, mostrar opción de subir archivo
    return (
      <div className="flex flex-col gap-4 w-full">
        <div
          className={`flex items-center justify-center w-full h-32 border-2 rounded-lg cursor-pointer transition 
          ${isDragging ? 'border-primary bg-primary/10' : 'border-dashed border-muted-foreground/50 bg-muted/50'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="flex flex-col items-center justify-center p-5">
            <UploadIcon className="w-8 h-8 mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz click para seleccionar'}
            </p>
            {file && <p className="text-xs mt-2 text-muted-foreground">{file.name}</p>}
          </div>
          <Input
            id="file-input"
            type="file"
            className="hidden"
            accept={nodeType === 'image'
              ? 'image/*'
              : nodeType === 'video'
                ? 'video/*'
                : nodeType === 'audio'
                  ? 'audio/*'
                  : '*'}
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Subiendo..." : "Subir Archivo"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Badge tipo de mensaje */}
      <div className="absolute -top-4 left-4 flex items-center space-x-2 bg-background border border-border rounded-md px-3 py-1 shadow-md">
        {currentAction?.icon || (
          <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {currentAction?.label || "Tipo desconocido"}
        </span>
      </div>

      {/* Card principal */}
      <Card className="shadow-md border border-border rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-4 text-left text-lg">
            {renderContent()}
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground px-4 py-3">
          <p className="italic">Creado el {formattedDate}</p>

          <div className="flex items-center gap-2">
            {/* Eliminar nodo */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" disabled={isDeleting}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Eliminar nodo</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  ¿Estás seguro de que deseas eliminar este nodo?
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
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
};