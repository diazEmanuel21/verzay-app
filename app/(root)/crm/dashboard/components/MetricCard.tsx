import { Card, CardContent } from "@/components/ui/card";

export const MetricCard = ({
    icon,
    label,
    value,
    helper,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    helper?: string;
}) => {
    return (
        <Card className="border-border bg-background/60">
            <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    <div className="h-7 w-7 rounded-full border flex items-center justify-center text-muted-foreground">
                        {icon}
                    </div>
                </div>
                <div className="text-xl font-semibold leading-none">{value}</div>
                {helper && (
                    <p className="text-muted-foreground">{helper}</p>
                )}
            </CardContent>
        </Card>
    );
}