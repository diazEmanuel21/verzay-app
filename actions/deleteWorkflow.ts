"use server"
import { auth } from "@/auth";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function DeleteWorkflow(id: string) {
    const session = await auth(); // Obtén la sesión del usuario

    const user = await db.user.findUnique({
        where: {email: session?.user.email ?? ""}
    });

  
    await db.workflow.delete({
      where: {
        id,
        userId: user?.id
      },
    });
  
    revalidatePath(`/flow`);
  }