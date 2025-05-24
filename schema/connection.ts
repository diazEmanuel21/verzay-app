import { EvolutionInstance } from "@/actions/fetch-intance-action"
import { Instancias, User } from "@prisma/client"
import { z } from "zod"


export const FormInstanceConnectionSchema = z.object({
    instanceName: z.string().min(2, "Campo requerido"),
})
export interface ClientInstanceCardProps {
    intanceName: string
    user: User
    currentInstanceInfo?: EvolutionInstance
};
export interface ConnectionMainInterface {
    user: User
    instance?: Instancias
    instanceInfo?: EvolutionInstance[]
}


export type FormInstanceConnectionValues = z.infer<typeof FormInstanceConnectionSchema>