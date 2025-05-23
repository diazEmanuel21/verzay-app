import { z } from "zod"


export const FormInstanceConnectionSchema = z.object({
    instanceName: z.string().min(2, "Campo requerido"),
})

export type FormInstanceConnectionValues = z.infer<typeof FormInstanceConnectionSchema>