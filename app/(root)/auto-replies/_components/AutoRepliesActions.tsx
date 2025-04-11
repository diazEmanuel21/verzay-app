"use client";

import { useState } from "react";
import { MoreVerticalIcon, ShuffleIcon, TrashIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TooltipWrapper from "@/components/TooltipWrapper";
import { GenericDeleteDialog } from "@/components/shared/GenericDeleteDialog";
import { deleteRR } from "@/actions/rr-actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AutoRepliesActionsProps {
    mensaje: string;
    autoReplieId: number;
    workflowId: string;
}

export const AutoRepliesActions = ({ mensaje, autoReplieId, workflowId}: AutoRepliesActionsProps) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <GenericDeleteDialog
                open={showDeleteDialog}
                setOpen={setShowDeleteDialog}
                itemName={mensaje}
                itemId={autoReplieId}
                mutationFn={() => deleteRR(autoReplieId)}
                entityLabel="respuesta rápida"
            />

            <Link href={`flow/${workflowId}`} className={cn(
                buttonVariants({
                    variant: "outline",
                    size: "sm"
                }),
                "flex items-center gap-2"
            )}>
                <ShuffleIcon size={16} />
                Editar
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={"outline"} size={"sm"}>
                        <TooltipWrapper content={"Más acciones"}>
                            <div className="flex items-center justify-center w-full h-full">
                                <MoreVerticalIcon size={18} />
                            </div>
                        </TooltipWrapper>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive flex items-center gap-2"
                        onSelect={() => setShowDeleteDialog(true)}
                    >
                        <TrashIcon size={16} /> Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
