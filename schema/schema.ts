import { Country } from '@/components/custom/CountryCodeSelect';
import { Instancias, User, Service, ApiKey, Reminders, Employee } from '@prisma/client';

interface UserWithIntance extends User {
    instancias: Instancias[]; // Array de registros Pausar
};

interface UserWithService extends UserWithIntance {
    Service: Service[];
};

export interface UserWithApiKeys extends UserWithService {
    apiKey: ApiKey | null; // ✅ Esto es lo que tienes
};

export interface UserWithEmployees extends UserWithApiKeys {
    employees: Employee[] | null; // ✅ Esto es lo que tienes
};

export interface ScheduleInterface {
    user: UserWithEmployees // Array de registros Pausar
    reminders?: Reminders[]
    countries?: Country[]
};
