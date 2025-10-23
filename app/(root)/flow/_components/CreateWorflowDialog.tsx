"use client";

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Layers2Icon, Loader2 } from 'lucide-react';
import CustomDialogHeader from '@/components/shared/CustomDialogHeader';
import { useForm } from 'react-hook-form';
import { createWorkflowSchema, createWorkflowSchemaType } from '@/schema/workflow';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";
import { createWorkflow } from '@/actions/workflow-actions';


function CreateWorflowDialog({ triggerText }: { triggerText?: String }) {
  const [open, setOpen] = useState(false);

  const form = useForm<createWorkflowSchemaType>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {},
  })

  // Configuración de la mutación
  const { mutate, isPending } = useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      toast.success("Flujo Creado", { id: "create-workflow" })
    },
    onError: () => {
      toast.error("Fallo la creacion del flujo", { id: "create-workflow" })
    },
  });

  const onSubmit = useCallback((values: createWorkflowSchemaType) => {
    toast.loading("Creando Flujo...", { id: "create-workflow" });
    mutate(values);
  }, [mutate]);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      form.reset();
      setOpen(open);
    }} >
      <DialogTrigger asChild>
        <Button>{triggerText ?? "CREAR FLUJO"}</Button>
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader
          icon={Layers2Icon}
          title="CREAR FLUJO"
        />
        <div className="p-6">
          <Form {...form}>
            <form className='space-y-8 w-full' onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex gap-1 items-center'>
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
              {/* <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex gap-1 items-center'>
                      Descripción
                      <p className="text-xs text-muted-foreground">(opcional)</p>
                    </FormLabel>
                    <FormControl>
                      <Textarea className='resize-none' {...field} />
                    </FormControl>
                    <FormDescription>
                      Por favor colocar una descripción breve
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <Button type='submit' className='w-full' disabled={isPending}>
                {!isPending && "Iniciar"}
                {isPending && <Loader2 className='animate-spin' ></Loader2>}
              </Button>

            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>)
}

export default CreateWorflowDialog;
