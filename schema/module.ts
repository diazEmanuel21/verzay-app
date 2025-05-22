import { z } from "zod"

export const ItemModuleSchema = z.object({
    url: z.string().min(1),
    title: z.string().min(1),
})

export const FormModuleSchema = z.object({
    label: z.string().min(1, "Campo requerido"),
    route: z.string().min(1, "Campo requerido"),
    icon: z.string().min(1, "Campo requerido"),
    showInSidebar: z.boolean().default(true),
    hiddenModule: z.boolean().default(false),
    adminOnly: z.boolean().default(false),
    requiresPremium: z.boolean().default(false),
    allowedPlans: z.array(z.string()).optional(),
    items: z.array(ItemModuleSchema).optional(),
})

export type FormModuleValues = z.infer<typeof FormModuleSchema>