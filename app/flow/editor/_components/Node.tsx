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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { CreateNode } from "@/actions/createNode";
import { Workflow } from "@prisma/client";

function CreateNodeDialog({ workflow }: { workflow: Workflow }) {
  const [open, setOpen] = useState(false);

  const form = useForm<createNodeflowSchemaType>({
    resolver: zodResolver(createNodeflowSchema),
    defaultValues: {workflowId: workflow.id},
  });

  // Configuración de la mutación
  const { mutate, isPending } = useMutation({
    mutationFn: CreateNode,
    onSuccess: () => {
      toast.success("Nodo creado exitosamente", { id: "create-node" });
      setOpen(false);
    },
    onError: (e) => {
      toast.error("Error al crear el nodo", { id: "create-node" });
      console.log(e)
    },
  });

  const onSubmit = useCallback(
    (values: createNodeflowSchemaType) => {
      toast.loading("Creando nodo...", { id: "create-node" });
      mutate(values);
    },
    [mutate]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
      <div className="w-full rounded-md bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[1px]">
      <Button
         variant={"outline"}
         className="dark:text-white w-full dark:bg-neutral-950 bg-white">
            <span className="bg-gradient-to-t from-red-500 to-orange-500 hover:to-orange-800 bg-clip-text text-transparent">
                Crear
            </span>
         </Button>
      </div>
      </DialogTrigger>
      <DialogContent className="px-0">
        <CustomDialogHeader
          icon={Layers2Icon}
          title="CREAR NODO"
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
                      Introduce el mensaje asociado con este nodo.
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
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                {!isPending && "Crear Nodo"}
                {isPending && <Loader2 className="animate-spin" />}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateNodeDialog;
