'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CalendarCheck2, BotMessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CreditsWidgetProps {
    total: number;
    remaining: number;
    renewalDate?: string;
}

export const CreditsWidget = ({ total, remaining, renewalDate }: CreditsWidgetProps) => {
    const [usedPercent, setUsedPercent] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (total > 0) {
            const percent = Math.min(100, Math.round((remaining / total) * 100));
            setUsedPercent(percent);
        }
    }, [total, remaining]);

    const onRedirectPlan = () => {
        router.push('/credits');
    };

    return (
        <Card
            className="bg-muted border-none shadow-none p-3  w-full cursor-pointer hover:bg-muted/80 transition"
            title="Haz clic para ver más información"
            onClick={onRedirectPlan}
        >
            <CardContent className="flex items-center gap-3 p-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="bg-[#1444A1]/10 p-2 rounded-full cursor-help">
                                <Zap className="h-5 w-5 text-[#1444A1]" />
                                {/* <BotMessageSquare className="h-5 w-5 text-[#1444A1]" /> */}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                            <CalendarCheck2 className="w-3 h-3 inline mr-1" />
                            Renovación: {renewalDate || 'N/A'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="flex-1">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>IA Créditos</span>
                        <span>{remaining} / {total}</span>
                    </div>

                    <Progress
                        value={usedPercent}
                        className={cn(
                            'h-1 mt-1 transition-all duration-300',
                            usedPercent < 30 ? 'bg-red-500' : 'bg-[#1444A1]'
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
