



"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Layers2Icon, Loader2 } from "lucide-react";
import CustomDialogHeader from "@/components/shared/CustomDialogHeader";
import { useForm } from "react-hook-form";
import { createNodeflowSchema, createNodeflowSchemaType } from "@/schema/nodeflow";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
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

export const workflowActions = [
  {
    label: "Texto",
    icon: <FileText className="h-5 w-5 text-purple-600" />,
  },
  {
    label: "Imagen",
    icon: <ImageIcon className="h-5 w-5 text-blue-500" />,
  },
  {
    label: "Video",
    icon: <Video className="h-5 w-5 text-red-500" />,
  },
  {
    label: "Archivo/Documento",
    icon: <File className="h-5 w-5 text-gray-500" />,
  },
  {
    label: "Audio",
    icon: <Music className="h-5 w-5 text-green-500" />,
  },
];

function CreateNodeDialog({ workflow }: { workflow: Workflow }) {
  const [open, setOpen] = useState(false);

  const form = useForm<createNodeflowSchemaType>({
    resolver: zodResolver(createNodeflowSchema),
    defaultValues: { workflowId: workflow.id },
  });

  // Configuración de la mutación
  const { mutate, isPending } = useMutation({
    mutationFn: CreateNode,
    onSuccess: () => {
      toast.success("Nodo creado exitosamente", { id: "create-node" });
      setOpen(false);
    },
    onError: (e) => {
      toast.error("Error al crear el acción", { id: "create-node" });
      console.log(e)
    },
  });

  const onSubmit = useCallback(
    (values: createNodeflowSchemaType) => {
      toast.loading("Creando acción...", { id: "create-node" });
      mutate(values);
    },
    [mutate]
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          form.reset();
          setOpen(open);
        }}
      >
        <DialogTrigger asChild>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm transition-all"
            >
              Agregar Acción
            </Button>
        </DialogTrigger>
        <DialogContent className="px-0">
          <CustomDialogHeader
            icon={Layers2Icon}
            title="CREAR ACCIÓN"
          />
          <div className="p-6">
            <Form {...form}>
              <form className="space-y-8 w-full" onSubmit={form.handleSubmit(onSubmit)}>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex gap-1 items-center">
                        Mensaje
                        <p className="text-xs text-primary">(obligatorio)</p>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Introduce el mensaje asociado con esta acción.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex gap-1 items-center">
                        Tipo de Mensaje
                        <p className="text-xs text-primary">(obligatorio)</p>
                      </FormLabel>

                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder="Selecciona un tipo"
                              className="capitalize"
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {workflowActions.map((action, index) => (
                            <SelectItem
                              key={index}
                              value={action.label}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div className="flex flex-row gap-2">
                                {action.icon}
                                <span>{action.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormDescription>
                        Especifica el tipo de mensaje (texto, imagen, etc.).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex gap-1 items-center">
                        URL del Datasource
                        <p className="text-xs text-muted-foreground">(opcional)</p>
                      </FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ingresa una URL de datasource si aplica.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {!isPending && "Crear acción"}
                  {isPending && <Loader2 className="animate-spin" />}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CreateNodeDialog;