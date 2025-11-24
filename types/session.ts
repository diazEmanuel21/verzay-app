export type Session = {
    id: number;
    userId: string;
    remoteJid: string;
    pushName: string;
    instanceId: string;
    createdAt: Date;
    updatedAt: Date;
    status: boolean;
    seguimientos?: string | null;
    inactividad?: string | null;
    tags?: {
        id: number;
        name: string;
        slug: string;
        color?: string | null;
    }[];
};

export type SimpleTag = {
    id: number;
    name: string;
    slug?: string;
    color?: string | null;
};