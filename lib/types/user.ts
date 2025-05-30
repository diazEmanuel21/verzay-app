import { IaCredit, Pausar, Session, User } from "@prisma/client";

export interface UserWithPausar extends User {
    pausar: Pausar[]; // Array de registros Pausar
};
export interface ClientInterface extends User {
    pausar: Pausar[];
    isEvoEnabled: boolean;
    reseller: User | null;
    credits: IaCredit | null;
};