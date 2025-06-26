import { Instancias, User } from "@prisma/client";

export interface UserWithIntance extends User {
    instancias: Instancias[]; // Array de registros Pausar
};
export interface ScheduleInterface {
    user: UserWithIntance; // Array de registros Pausar
};
