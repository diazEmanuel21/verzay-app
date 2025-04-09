'use client';

import React, { useCallback, useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { createNodeflowSchema, createNodeflowSchemaType } from "@/schema/nodeflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { CreateNode } from "@/actions/createNode";
import { Role, Workflow } from "@prisma/client";
import { baseActions, seguimientoActions } from "../helpers";
import { Action } from '../types';

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
} from "@/components/ui/collapsible"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ActionPopoverButton } from "./ActionPopoverButton";

interface PropsCreateNodeComponent {
    workflowId: Workflow['id'];
    role: Role;
};

export const CreateNodeComponent = ({ workflowId, role }: PropsCreateNodeComponent) => {
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
                <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                    Agregar acción
                    <FilePlus2 />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-64 p-4 space-y-4 bg-background border rounded-lg shadow-lg">
                <div className="text-sm font-semibold text-muted-foreground">Selecciona una acción</div>

                <div className="flex flex-col gap-2">
                    {baseActions.map((action) => (
                        <ActionPopoverButton
                            key={action.type}
                            action={action}
                            onClick={() => handleActionSelect(action.type)}
                            disabled={isPending}
                            role={role}
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
                                    role={role}
                                />
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
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