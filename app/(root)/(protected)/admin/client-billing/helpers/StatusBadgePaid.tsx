import { Badge } from "@/components/ui/badge";
import { BillingStatus } from "@/types/billing";

export function StatusBadgePaid(status?: BillingStatus) {
    if (status === "PAID") return <Badge className="text-xs">Pagó</Badge>;
    return (
        <Badge variant="destructive" className="text-xs">
            Mora
        </Badge>
    );
}