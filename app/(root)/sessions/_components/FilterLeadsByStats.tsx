import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Database, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterKey = "all" | "active" | "inactive";

export interface FilterLeadsByStatsProps {
    stats: { total: number; active: number; inactive: number } | null;
    filter: FilterKey;
    onChangeFilter: (value: FilterKey) => void;
}

export const FilterLeadsByStats = ({
    stats,
    filter,
    onChangeFilter,
}: FilterLeadsByStatsProps) => {
    const total = stats?.total ?? 0;
    const active = stats?.active ?? 0;
    const inactive = stats?.inactive ?? 0;

    const cardStats = [
        {
            key: "all" as const,
            title: "Total",
            icon: <Database className="h-4 w-4 text-gray-500" />,
            value: total,
            description: "Leads en total",
            color: "",
            progress: null as number | null,
        },
        {
            key: "active" as const,
            title: "Activos",
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
            value: active,
            description: total
                ? `${Math.round((active / total) * 100)}% del total`
                : "0% del total",
            color: "text-green-600",
            progress: total ? (active / total) * 100 : 0,
        },
        {
            key: "inactive" as const,
            title: "Inactivos",
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            value: inactive,
            description: total
                ? `${100 - Math.round((active / total) * 100)}% del total`
                : "0% del total",
            color: "text-red-600",
            progress: total ? 100 - (active / total) * 100 : 0,
        },
    ] as const;

    return (
        <>
            {cardStats.map((card, idx) => {
                const isActive = filter === card.key;
                return (
                    <Card
                        key={idx}
                        onClick={() => onChangeFilter(card.key)}
                        className={cn(
                            "flex-1 flex flex-col overflow-hidden cursor-pointer transition-all duration-300 ease-in-out border rounded-xl hover:shadow-md hover:-translate-y-[2px]",
                            isActive
                                ? "border-primary ring-primary bg-muted/20"
                                : "border-border"
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xs flex-row sm:text-sm font-medium text-muted-foreground">
                                <div className={cn("text-lg font-bold", card.color)}>
                                    {card.value}
                                </div>
                                {card.title}
                            </CardTitle>
                            <div className="hidden sm:block">{card.icon}</div>
                        </CardHeader>
                        {/* <CardContent>
                            {stats ? (
                                <>
                                    {card.progress !== null && (
                                        <div className="relative mt-2">
                                            <Progress
                                                value={card.progress}
                                                className="flex items-center justify-center h-4 transition-all duration-500"
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs">
                                                {card.description}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Skeleton className="h-8 w-24" />
                            )}
                        </CardContent> */}
                    </Card>
                );
            })}
        </>
    );
};