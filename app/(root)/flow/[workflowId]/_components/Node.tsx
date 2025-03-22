'use client';

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Layers2Icon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { createNodeflowSchema, createNodeflowSchemaType } from "@/schema/nodeflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { CreateNode } from "@/actions/createNode";
import { Workflow } from "@prisma/client";

import {
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Music,
} from "lucide-react";

// Opciones del tipo de acción
export const workflowActions = [
  { label: "Texto", icon: <FileText className="h-5 w-5 text-purple-600" /> },
  { label: "Imagen", icon: <ImageIcon className="h-5 w-5 text-blue-500" /> },
  { label: "Video", icon: <Video className="h-5 w-5 text-red-500" /> },
  { label: "Archivo/Documento", icon: <File className="h-5 w-5 text-gray-500" /> },
  { label: "Audio", icon: <Music className="h-5 w-5 text-green-500" /> },
];

function CreateNodeDialog({ workflow }: { workflow: Workflow }) {
  const [open, setOpen] = useState(false);

  const form = useForm<createNodeflowSchemaType>({
    resolver: zodResolver(createNodeflowSchema),
    defaultValues: {
      workflowId: workflow.id,
      tipo: "",
      message: "",
      url: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: CreateNode,
    onSuccess: () => {
      toast.success("Nodo creado exitosamente", { id: "create-node" });
      setOpen(false);
      form.reset();
    },
    onError: (e) => {
      toast.error("Error al crear la acción", { id: "create-node" });
      console.error(e);
    },
  });

  // Manejo del submit SOLO para el campo "tipo"
  const handleActionSelect = useCallback(
    (actionLabel: string) => {
      const defaultMessage = "Msg";
      const defaultUrl = "https://tudominio.com/api";
  
      form.setValue("tipo", actionLabel);
      form.setValue("message", defaultMessage);
      form.setValue("url", defaultUrl);
  
      toast.loading("Creando acción...", { id: "create-node" });
  
      mutate({
        workflowId: workflow.id,
        tipo: actionLabel,
        message: defaultMessage,
        url: defaultUrl,
      });
    },
    [form, mutate, workflow.id]
  );
  

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.5C2 3.22386 2.22386 3 2.5 3H12.5C12.7761 3 13 3.22386 13 3.5V9.5C13 9.77614 12.7761 10 12.5 10H2.5C2.22386 10 2 9.77614 2 9.5V3.5ZM2 10.9146C1.4174 10.7087 1 10.1531 1 9.5V3.5C1 2.67157 1.67157 2 2.5 2H12.5C13.3284 2 14 2.67157 14 3.5V9.5C14 10.1531 13.5826 10.7087 13 10.9146V11.5C13 12.3284 12.3284 13 11.5 13H3.5C2.67157 13 2 12.3284 2 11.5V10.9146ZM12 11V11.5C12 11.7761 11.7761 12 11.5 12H3.5C3.22386 12 3 11.7761 3 11.5V11H12ZM5 6.5C5 6.22386 5.22386 6 5.5 6H7V4.5C7 4.22386 7.22386 4 7.5 4C7.77614 4 8 4.22386 8 4.5V6H9.5C9.77614 6 10 6.22386 10 6.5C10 6.77614 9.77614 7 9.5 7H8V8.5C8 8.77614 7.77614 9 7.5 9C7.22386 9 7 8.77614 7 8.5V7H5.5C5.22386 7 5 6.77614 5 6.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-4 space-y-4 bg-background border rounded-lg shadow-lg">
        <div className="text-sm font-semibold text-muted-foreground">Selecciona una acción</div>

        <div className="flex flex-col gap-2">
          {workflowActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleActionSelect(action.label)}
              className="flex items-center justify-start gap-2 text-sm w-full"
              disabled={isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Creando acción...
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default CreateNodeDialog;
