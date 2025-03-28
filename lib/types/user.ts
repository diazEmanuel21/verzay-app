import { Pausar, User } from "@prisma/client";

export type UserWithPausar = User & {
    pausar: Pausar[]; // Array de registros Pausar
};