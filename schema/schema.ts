import { Instancias, User, Service } from '@prisma/client';

export interface UserWithIntance extends User {
    instancias: Instancias[]; // Array de registros Pausar
};

export interface UserWithService extends UserWithIntance {
    Service: Service[];
}
export interface ScheduleInterface {
    user: UserWithService; // Array de registros Pausar
};
