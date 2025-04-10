'use client';

import React, { ChangeEvent, useState, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { User, WorkflowNode } from "@prisma/client";
import { updateNode, deleteNode, updateUrlNode, updateDelayNode, deleteFileNode, updateInactivityNode } from "@/actions/createNode";
import { ACCEPT_TYPES, baseActions, convertToSeconds, getAcceptTypeString, optimizeFile, seguimientoActions, validateFileType } from "../helpers";
import { Action } from "../types";
import { NodeActions } from "./NodeActions";

import {
  Card,
  CardHeader,
  CardFooter,
  CardContent
} from "@/components/ui/card";

import { toast } from "sonner";
import {
  MessageSquareIcon,
  UploadIcon,
} from "lucide-react";
import { TimeInput } from "@/components/shared/TimeInput";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GenericTextarea } from "@/components/shared/GenericTextarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
interface Props {
  workflowId: string;
  nodes: WorkflowNode;
  user: User;
};

const MAX_MESSAGE_LENGTH = 1000;

export const NodeCard = ({ nodes, workflowId, user }: Props) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(nodes.message);
  const [delay, setDelay] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inactivity, setInactivity] = useState(nodes.inactividad ?? false);

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

  const handleInactivity = async (checked: boolean) => {
    if (loading) return;
    setLoading(true);
    setInactivity(checked);
    const toastId = `update-inactivity`;

    try {
      const res = await updateInactivityNode(nodes.id, checked);
      if (!res) return;
      if (!res.success) return toast.error(res.message, { id: toastId });
      toast.success(res.message, { id: toastId });
    } catch (error) {
      toast.error(`Server err: ${error}`, { id: toastId });
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

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

  const handleTimeChange = (delay: string) => {
    setDelay(delay);
  };

  const handleOnBlurTime = async () => {
    if (!delay) return;
    if (parseInt(delay) === 0) return;

    try {
      //convierte los segundos
      // const delayInSeconds = convertToSeconds(delay);

      const res = await updateDelayNode(nodes.id, delay.toString());

      if (!res) return toast.error('404');
      if (!res.success) return toast.error(res?.message);

      toast.success(res?.message);

    } catch (error) {
      toast.error(`Error al actualizar un seguimiento. Contactese con nosotros. ${error}`)
    }
  };

  const renderContent = () => {
    if (baseType === 'text') {
      return (
        <GenericTextarea
          fileType={baseType}
          message={message}
          handleSave={handleSave}
          setIsEditing={setIsEditing}
          setMessage={handleChangeMessages}
          isPending={isPending}
          isEditing={isEditing}
        />
      )
    }

    // Para tipos de archivo (image, video, audio, documento)
    if (hasContent) {
      return (
        <div className="flex items-center w-full rounded">
          {baseType === 'image' && (
            <img src={nodes.url!} alt="Contenido del nodo" className="rounded-md w-full h-auto object-contain" />
          )}
          {baseType === 'video' && (
            <video src={nodes.url!} controls className="rounded-md w-full h-auto" />
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
          <div className="flex flex-col items-center justify-center w-full px-2">
            <UploadIcon className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center mt-1">
              {isDragging ? 'Suelta el archivo aquí' : 'Arrastra o haz click'}
            </p>
            {file && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate w-full px-2">
                    {file.name}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{file.name}</p>
                </TooltipContent>
              </Tooltip>
            )}
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
              size="sm"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Subiendo..." : "Subir"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const handleChangeMessages = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    // Verificación de seguridad (TypeScript ya valida el tipo, pero es redundante por si el evento es manualmente disparado)
    if (!e?.target) {
      console.error('Evento inválido o sin target');
      return;
    }

    const { value } = e.target;

    if (value.length > MAX_MESSAGE_LENGTH) {
      toast.info(`El mensaje excede el límite de ${MAX_MESSAGE_LENGTH} caracteres`)
      return;
    }

    setMessage(value);
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <Card className=" shadow-md border border-border rounded-lg min-w-[300px] max-w-[300px]">
          <CardHeader className="relative flex items-center">
            {/* Badge tipo de mensaje */}
            <div className="absolute -top-4 flex items-center space-x-2 bg-background border border-border rounded-md px-3 py-1 shadow-md">
              {currentAction?.icon || (
                <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {`${isSeguimiento ? labelSegumientoCategory : currentAction?.label}` || "Tipo desconocido"}
              </span>
            </div>
            <div className="absolute top-0 right-1">
              <NodeActions
                fileType={baseType}
                onDeleteFile={() => handleDeleteFile()}
                onDeleteNode={() => handleDeleteNode()}
              />
            </div>
          </CardHeader>
          <CardContent>
            {renderContent()}
            {baseType !== 'text' && baseType !== 'document' && baseType !== 'audio' &&
              <div className="flex w-full mt-2">
                <GenericTextarea
                  fileType={baseType}
                  message={message}
                  handleSave={handleSave}
                  setIsEditing={setIsEditing}
                  setMessage={handleChangeMessages}
                  isPending={isPending}
                  isEditing={isEditing}
                />
              </div>
            }
            {isSeguimiento &&
              <div className="flex items-center gap-2 pt-4">
                <Switch
                  id="airplane-mode"
                  checked={inactivity}
                  onCheckedChange={handleInactivity}
                  disabled={loading}
                />
                <Label htmlFor="inactividad-state">Inactividad</Label>
              </div>
            }
          </CardContent>
          {isSeguimiento &&
            <>
              <Separator />
              <CardFooter className="pt-2">
                <TimeInput
                  className="text-xs text-muted-foreground"
                  onChange={handleTimeChange}
                  onBlur={handleOnBlurTime}
                  currentValue={nodes.delay || 'minutes-0'}
                />
              </CardFooter>
            </>
          }
        </Card>
      </div>
    </>
  );
};
