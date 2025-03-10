"use server"
import { auth } from "@/auth";

import { db } from "@/lib/db";
import { createWorkflowSchema, createWorkflowSchemaType } from "@/schema/workflow";
import { WorkflowStatus } from "@/types/workflow";
import { redirect } from "next/navigation";

export async function CreateWorkflow(form: createWorkflowSchemaType) {
    const session = await auth(); // Obtén la sesión del usuario

    const user = await db.user.findUnique({
        where: {email: session?.user.email ?? ""}
    });

    if (!session?.user?.id) {
      console.log("Usuario no autenticado");
    }

    console.log("Sesión del usuario: ", session);

  
    const { success, data } = createWorkflowSchema.safeParse(form);
  
    if (!success) {
      throw new Error("Datos del formulario inválidos.");
    }
  
    const result = await db.workflow.create({
      data: {
        userId: user?.id!, // Asegurarse de que userId no sea undefined
        status: WorkflowStatus.DRAFT,
        definition: "TODO",
        ...data,
      },
    });
  
    if (!result) {
      throw new Error("Fallo la creación del flujo.");
    }
  
    redirect(`/flow/editor/${result.id}`);
  }