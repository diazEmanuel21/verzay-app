import { EvolutionInstance } from "@/actions/fetch-intance-action"
import { Instancias, User, PromptInstancia } from "@prisma/client"
import { z } from "zod"


export const FormInstanceConnectionSchema = z.object({
    instanceName: z.string().min(2, "Campo requerido"),
    tipoInstancia: z.string().min(2, "Campo requerido"),
})

export interface ClientInstanceCardProps {
    intanceName: string
    user: User
    instanceType:string
    currentInstanceInfo?: EvolutionInstance
    prompts?: PromptInstancia[] // <-- Se ha añadido esta nueva propiedad
};

export interface ConnectionMainInterface {
    user: User
    instance?: Instancias
    instanceType:string
    instanceInfo?: EvolutionInstance[]
    prompts?: PromptInstancia[]
}

export type FormInstanceConnectionValues = z.infer<typeof FormInstanceConnectionSchema>
