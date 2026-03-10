"use client";

import { CircleHelp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
            <CardContent className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">{label}</span>
                        {helper ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                                        aria-label={`Informacion sobre ${label}`}
                                    >
                                        <CircleHelp className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="max-w-56 text-xs"
                                >
                                    {helper}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>
                    <div className="h-7 w-7 rounded-full border flex items-center justify-center text-muted-foreground">
                        {icon}
                    </div>
                </div>
                <div className="text-xl font-semibold leading-none">{value}</div>
            </CardContent>
        </Card>
    );
}
