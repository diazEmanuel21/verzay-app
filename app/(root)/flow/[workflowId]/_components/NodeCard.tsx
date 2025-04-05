'use client';

import React, { useState, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { User, WorkflowNode } from "@prisma/client";
import { updateNode, deleteNode, updateUrlNode, updateDelayNode, deleteFileNode } from "@/actions/createNode";
import { ACCEPT_TYPES, baseActions, getAcceptTypeString, optimizeFile, seguimientoActions, validateFileType } from "../helpers";
import { Action } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import {
  MessageSquareIcon,
  UploadIcon,
} from "lucide-react";
import { TimeInput } from "@/components/shared/TimeInput";
import { NodeActions } from "./NodeActions";
interface Props {
  workflowId: string;
  nodes: WorkflowNode;
  user: User;
};

export const NodeCard = ({ nodes, workflowId, user }: Props) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(nodes.message);
  const [delay, setDelay] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const nodeType = nodes.tipo?.toLowerCase() as Action['type'];
  const baseType = nodeType.startsWith('seguimiento-')
    ? nodeType.split('-')[1] as Action['type']
    : nodeType;
  const hasContent = nodeType === 'text' ? !!message : !!nodes.url;
  const allActions = [...baseActions, ...seguimientoActions];
  const currentAction = allActions.find(
    (action) => action.type.toLowerCase() === nodeType
  );

  const accept = baseType && ACCEPT_TYPES[baseType]
    ? ACCEPT_TYPES[baseType].join(',')
    : '*';

  // Mostrar "Seguimiento" en la etiqueta pero usar baseType para la lógica
  const isSeguimiento = nodeType.startsWith('seguimiento-');
  const labelSegumientoCategory = isSeguimiento
    ? `Seguimiento ${currentAction?.label.replace('Seguimiento ', '')}`
    : currentAction?.label;

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

  const handleDeleteNode = async () => {
    const toastId = `delete-${currentAction?.label}`;
    toast.loading(`Eliminando ${currentAction?.label}...`, { id: toastId });

    try {
      // Paso 1: Eliminar archivo y limpiar la URL (si aplica)
      if (nodes.url) {
        const fileRes = await deleteFileNode(nodes.url, nodes.id);

        if (!fileRes.success) {
          toast.error(fileRes.message, { id: toastId });
          return;
        }
      }
      // Paso 2: Eliminar el nodo
      const res = await deleteNode(nodes.id, workflowId);

      if (!res || !res.success) {
        toast.error(res?.message || "Error desconocido al eliminar el nodo.", { id: toastId });
        return;
      }

      toast.success(res.message, { id: toastId });
      router.refresh();

    } catch (error) {
      console.error("Error en eliminación:", error);
      toast.error(`Error eliminando el nodo: ${error instanceof Error ? error.message : error}`, {
        id: toastId,
      });
    }
  };


  const handleDeleteFile = async () => {
    const toastId = `delete-${currentAction?.type}`;
    toast.loading(`Eliminando ${currentAction?.type}...`, { id: toastId });

    try {
      const res = await deleteFileNode(nodes.url as string, nodes.id);
      if (!res) return;
      if (!res.success) return toast.error(res?.message, { id: toastId });
      toast.success(res?.message, { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(`Error eliminando el archivo: ${error}`, { id: toastId });
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
    const nodeTypeIsImage = baseType === 'image';
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

  const handleFile = (file: File) => {
    if (!file) return;
    const isValid = validateFileType(file, baseType);
    if (!isValid) {
      const readableTypes = getAcceptTypeString(baseType);
      toast.error(`Tipo de archivo no válido. Se esperaba: ${baseType} (${readableTypes})`);
      return;
    }

    setFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleTimeChange = (seconds: number) => {
    const delay = seconds.toString();
    setDelay(delay);
  };

  const handleOnBlurTime = async () => {
    if (!delay) return;
    if (parseInt(delay) === 0) return;

    try {
      const res = await updateDelayNode(nodes.id, delay);
      if (!res) return toast.error('404');
      if (!res.success) return toast.error(res?.message);

      toast.success(res?.message);

    } catch (error) {
      toast.error(`Error al actualizar un seguimiento. Contactese con nosotros. ${error}`)
    }
  };

  const renderContent = () => {
    if (baseType === 'text') {
      return isEditing ? (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={handleSave}
          rows={3}
          autoFocus
          disabled={isPending}
          className="w-full p-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary
                    sm:text-base
                    md:rounded-xl
                    lg:p-4
                    resize-y min-h-[120px]"
        />
      ) : (
        <div
          className="w-full flex items-start gap-3 p-3 text-sm cursor-pointer hover:bg-muted/50
                    border border-muted-foreground/20 rounded-lg bg-muted transition-all
                    sm:text-base
                    md:p-4 md:rounded-xl
                    lg:gap-4"
          onClick={() => setIsEditing(true)}
        >
          <MessageSquareIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {message || <span className="italic text-muted-foreground/50">Click para editar...</span>}
          </span>
        </div>
      );
    }

    // Para tipos de archivo (image, video, audio, documento)
    if (hasContent) {
      return (
        <div className="w-full pt-2">
          {baseType === 'image' && (
            <img src={nodes.url!} alt="Contenido del nodo" className="rounded-md w-full h-auto max-h-20 object-contain" />
          )}
          {baseType === 'video' && (
            <video src={nodes.url!} controls className="rounded-md w-full h-auto max-h-20" />
          )}
          {baseType === 'audio' && (
            <audio src={nodes.url!} controls className="w-full" />
          )}
          {baseType === 'document' && (
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
      <div className="flex flex-col gap-2 w-full">
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
            accept={accept}
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
    <>

      <div className="flex items-center justify-center">
        <Card className="relative shadow-md border border-border rounded-lg min-w-[300px] max-w-[300px]">
          {/* Badge tipo de mensaje */}
          <div className="absolute -top-4 left-4 flex items-center space-x-2 bg-background border border-border rounded-md px-3 py-1 shadow-md">
            {currentAction?.icon || (
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground capitalize">
              {`${isSeguimiento ? labelSegumientoCategory : currentAction?.label}` || "Tipo desconocido"}
            </span>
          </div>
          <div className="absolute right-1">
            <NodeActions
              onDeleteFile={() => handleDeleteFile()}
              onDeleteNode={() => handleDeleteNode()}
            />
          </div>
          <CardHeader>
            <CardTitle className="flex items-start justify-between text-left text-lg">
              {renderContent()}
            </CardTitle>
          </CardHeader>
          {isSeguimiento &&
            <>
              <Separator />
              <CardFooter className="pt-2">
                <TimeInput className="text-xs text-muted-foreground" onChange={handleTimeChange} onBlur={handleOnBlurTime} />
              </CardFooter>
            </>
          }
        </Card>
      </div>
    </>
  );
};
