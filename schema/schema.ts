import { Instancias, User, Service, ApiKey } from '@prisma/client';

interface UserWithIntance extends User {
    instancias: Instancias[]; // Array de registros Pausar
};

interface UserWithService extends UserWithIntance {
    Service: Service[];
};

interface UserWithApiKeys extends UserWithService {
    apiKey: ApiKey | null; // ✅ Esto es lo que tienes
};

export interface ScheduleInterface {
    user: UserWithApiKeys; // Array de registros Pausar
};
