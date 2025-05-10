"use client"

import { useState } from "react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import TooltipWrapper from '@/components/TooltipWrapper'
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon, TrashIcon } from "lucide-react";
import DeleteWorkflowDialog from "./DeleteWorkflowDialog";

export const WorkflowAction = ({ workflowName, workflowId, userId }: { workflowName: string, workflowId: string, userId: string }) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <DeleteWorkflowDialog
                open={showDeleteDialog}
                setOpen={setShowDeleteDialog}
                workflowName={workflowName}
                workflowId={workflowId}
                userId={userId}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>

                    <Button variant={"outline"} size={"sm"}>
                        <TooltipWrapper content={"Mas Acciones"} >
                            <div className="flex items-center justify-center w-full h-full">
                                <MoreVerticalIcon size={18} />
                            </div>
                        </TooltipWrapper>
                    </Button>

                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='text-destructive flex items items-center gap-2'
                        onSelect={() => {
                            setShowDeleteDialog((prev) => !prev)
                        }}
                    >
                        <TrashIcon size={16} />Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )

}
