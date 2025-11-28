"use client";

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Layers2Icon, Loader2 } from 'lucide-react';
import CustomDialogHeader from '@/components/shared/CustomDialogHeader';
import { useForm } from 'react-hook-form';
import { createWorkflowSchema, createWorkflowSchemaType } from '@/schema/workflow';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createWorkflow } from '@/actions/workflow-actions';

function CreateWorflowDialog({ triggerText }: { triggerText?: String }) {
  const [open, setOpen] = useState(false);

  // Select "fantasma" para el tipo de coincidencia
  const [matchType, setMatchType] = useState<"Exacta" | "Contiene">("Exacta");

  const form = useForm<createWorkflowSchemaType>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {},
  });

  // Configuración de la mutación
  const { mutate, isPending } = useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      toast.success("Flujo Creado", { id: "create-workflow" });
    },
    onError: () => {
      toast.error("Fallo la creacion del flujo", { id: "create-workflow" });
    },
  });

  const onSubmit = useCallback(
    (values: createWorkflowSchemaType) => {
      // Armamos el JSON que se guardará dentro de description
      const descriptionJson = values.description
        ? JSON.stringify({
          matchType: matchType.toLocaleLowerCase(),          // "Exacta" | "Contiene"
          keyword: values.description?.trim().toLocaleLowerCase() || "",
        })
        : "";

      const payload: createWorkflowSchemaType = {
        ...values,
        description: descriptionJson,
      };

      toast.loading("Creando Flujo...", { id: "create-workflow" });
      mutate(payload);
    },
    [mutate, matchType]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        setMatchType("Exacta"); // Reseteamos el select al abrir/cerrar
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerText ?? "CREAR FLUJO"}</Button>
      </DialogTrigger>
      <DialogContent className="px-0">
        <CustomDialogHeader
          icon={Layers2Icon}
          title="CREAR FLUJO"
        />
        <div className="p-6">
          <Form {...form}>
            <form
              className="space-y-8 w-full"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Nombre
                      <p className="text-xs text-primary">(obligatorio)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Escribe un nombre unico para el flujo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SELECT FANTASMA: Exacta / Contiene */}
              <div className="space-y-1">
                <FormLabel className="flex gap-1 items-center">
                  Tipo de coincidencia
                  <p className="text-xs text-muted-foreground">(solo para la lógica interna)</p>
                </FormLabel>
                <select
                  value={matchType}
                  onChange={(e) =>
                    setMatchType(e.target.value as "Exacta" | "Contiene")
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Exacta">Exacta</option>
                  <option value="Contiene">Contiene</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Define si la palabra clave debe coincidir de forma exacta o si basta con que esté contenida en el mensaje.
                </p>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Palabra clave
                      <p className="text-xs text-muted-foreground">(opcional)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Por favor colocar una palabra clave. Se guardará junto con el tipo de coincidencia como JSON.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {!isPending && "Iniciar"}
                {isPending && <Loader2 className="animate-spin" />}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateWorflowDialog;