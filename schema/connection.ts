import { EvolutionInstance } from "@/actions/fetch-intance-action"
import { Instancia, User, PromptInstance } from "@prisma/client"
import { z } from "zod"


export const FormInstanceConnectionSchema = z.object({
    instanceName: z.string().min(2, "Campo requerido"),
    instanceType: z.string().min(2, "Campo requerido"),
})

export interface ClientInstanceCardProps {
    intanceName: string
    user: User
    instanceType: string
    currentInstanceInfo?: EvolutionInstance
    prompts?: PromptInstance[] // <-- Se ha añadido esta nueva propiedad
};

export interface ConnectionMainInterface {
    user: User
    instance?: Instancia
    instanceType: string
    instanceInfo?: EvolutionInstance[]
    prompts?: PromptInstance[]
}

export type FormInstanceConnectionValues = z.infer<typeof FormInstanceConnectionSchema>
