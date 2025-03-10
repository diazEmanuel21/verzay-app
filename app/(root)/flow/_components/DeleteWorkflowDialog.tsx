"use client"

import { DeleteWorkflow } from "@/actions/deleteWorkflow";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";

  
import React, { useState } from 'react'
import { toast } from "sonner";
import { workerData } from "worker_threads";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    workflowName: string;
    workflowId: string;
}

function DeleteWorkflowDialog({open, setOpen, workflowName, workflowId}: Props) {
  const [confirmText, setConfirmText] = useState("");

  const deleteMutation = useMutation({
    mutationFn: DeleteWorkflow,
    onSuccess: ()=>{
      toast.success("Flujo elminado satisfactoriamente", {id: workflowId});
      setConfirmText("");
    },
    onError: ()=>{
      toast.error("Hubo un error al eliminar el flujo", {id: workflowId})
    }
  })
  return (
    <AlertDialog open={open} onOpenChange={setOpen} >
      <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription>Si eliminas este flujo, mas adelante no podras recuperarlo.</AlertDialogDescription>
            <div className="flex flex-col py-4 gap-2">
                <p>Estas seguro en eliminar el flujo <b className="text-primary">{workflowName}</b>, Enter para confirmar.</p>
                <Input value={confirmText} onChange={(e)=> setConfirmText(e.target.value)} />
            </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onClick={()=>setConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
             disabled={confirmText !== workflowName || deleteMutation.isPending}
             className="bg-destructive text-destructive-foreground 
             hover:bg-destructive/90"
             onClick={(e)=>{
              e.stopPropagation();
              toast.loading("Eliminado Flujo...", {id: workflowId})
              deleteMutation.mutate(workflowId)
             }} 
            >
              Eliminar
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteWorkflowDialog
