import { Badge } from "@/components/ui/badge";
import { ServiceAccessStatus } from "@prisma/client";

export function StatusBadgeAccess(status?: ServiceAccessStatus) {
    if (status === "ACTIVE") return <Badge>Activo</Badge>;
    return (
        <Badge variant="destructive">
            Suspendido
        </Badge>
    );
}