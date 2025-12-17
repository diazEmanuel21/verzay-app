'use client';

import React, { useCallback, useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { createNodeflowSchema, createNodeflowSchemaType } from "@/schema/nodeflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { CreateNode } from "@/actions/createNode";
import { Plan, Workflow } from "@prisma/client";
import { baseActions, seguimientoActions } from "../helpers";
import { Action } from '../types';

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
} from "@/components/ui/collapsible"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ActionPopoverButton } from "./ActionPopoverButton";
import { cn } from "@/lib/utils";

interface PropsCreateNodeComponent {
    workflowId: Workflow['id'];
    plan: Plan;
};

export const CreateNodeComponent = ({ workflowId, plan }: PropsCreateNodeComponent) => {
    const [open, setOpen] = useState(false);
    const [isOpenCollapse, setIsOpenCollapse] = useState(false);

    const form = useForm<createNodeflowSchemaType>({
        resolver: zodResolver(createNodeflowSchema),
        defaultValues: {
            workflowId: workflowId,
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

    const handleActionSelect = useCallback(
        (actionType: Action['type']) => {
            const defaultMessage = "";
            const allActions = [...baseActions, ...seguimientoActions];
            const actionSelected = allActions.find(action => action.type === actionType);

            if (!actionSelected) {
                toast.error("Acción no encontrada", { id: "create-node" });
                return;
            }

            if (actionSelected.type === 'seguimiento') {
                setIsOpenCollapse(prev => !prev);
                return;
            }

            form.setValue("tipo", actionSelected.type);
            form.setValue("message", defaultMessage);

            toast.loading("Creando acción...", { id: "create-node" });

            mutate({
                workflowId: workflowId,
                tipo: actionSelected.type,
                message: defaultMessage,
            });
        },
        [form, mutate, workflowId]
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button">
                    Agregar acción
                    <FilePlus2 />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="center"
                side="top"          // 👈 por defecto arriba (Radix flipa si no cabe)
                sideOffset={8}
                collisionPadding={12}
                className={cn(
                    "p-0 overflow-hidden", // 👈 importante: p-0, overflow-hidden
                    "w-[320px]",
                    "h-[420px] sm:h-[460px] md:h-[460px] lg:h-[460px]"
                )}
            >
                {/* ✅ flexbox interno */}
                <div className="h-full flex flex-col">
                    {/* Header fijo */}
                    <div className="p-4 pb-3 text-sm text-muted-foreground shrink-0">
                        Selecciona una acción
                    </div>

                    {/* Body con scroll */}
                    <div className="px-4 pb-4 flex-1 min-h-0 overflow-y-auto pr-2">
                        <div className="flex flex-col gap-2">
                            {baseActions.map((action) => (
                                <ActionPopoverButton
                                    key={action.type}
                                    action={action}
                                    onClick={() => handleActionSelect(action.type)}
                                    disabled={isPending}
                                    plan={plan}
                                />
                            ))}

                            <Collapsible open={isOpenCollapse} onOpenChange={setIsOpenCollapse}>
                                <CollapsibleContent className="ml-2 space-y-2">
                                    {seguimientoActions.map((action) => (
                                        <ActionPopoverButton
                                            key={action.type}
                                            action={action}
                                            onClick={() => handleActionSelect(action.type)}
                                            disabled={isPending}
                                            plan={plan}
                                        />
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>

                    {/* Footer fijo */}
                    {isPending && (
                        <div className="px-4 pb-4 shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Creando acción...
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}