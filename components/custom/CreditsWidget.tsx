'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CalendarCheck2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getIaCreditByUser } from '@/actions/actions-ia-credits';

interface CreditsWidgetProps {
    userId: string;
}

export const CreditsWidget = ({ userId }: CreditsWidgetProps) => {
    const router = useRouter();

    const [credits, setCredits] = useState<{
        total: number;
        remaining: number;
        renewalDate?: string;
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [usedPercent, setUsedPercent] = useState(0);

    useEffect(() => {
        const fetchCredits = async () => {
            setLoading(true);
            const res = await getIaCreditByUser(userId);
            if (res.success && res.data && res.data.length > 0) {
                const credit = res.data[0];
                const remaining = credit.total - credit.used;

                setCredits({
                    total: credit.total,
                    remaining,
                    renewalDate: new Date(credit.renewalDate).toISOString(),
                });

                const percent = Math.min(100, Math.round((remaining / credit.total) * 100));
                setUsedPercent(percent);
            } else {
                setCredits(null);
            }
            setLoading(false);
        };

        if (userId) fetchCredits();
    }, [userId]);

    const onRedirectPlan = () => {
        router.push('/credits');
    };

    return (
        <Card
            className="bg-muted border-none shadow-none p-2 w-full cursor-pointer hover:bg-muted/80 transition"
            title="Haz clic para ver más información"
            onClick={credits ? onRedirectPlan : undefined}
        >
            <CardContent className="flex items-center gap-3 p-0 min-h-[30px]">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="bg-[#1444A1]/10 p-2 rounded-full cursor-help">
                                <Zap className="h-5 w-5 text-[#1444A1]" />
                            </div>
                        </TooltipTrigger>
                        {credits?.renewalDate && (
                            <TooltipContent className="text-xs">
                                <CalendarCheck2 className="w-3 h-3 inline mr-1" />
                                Renovación: {new Date(credits.renewalDate).toLocaleDateString()}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <div className="flex-1">
                    {loading ? (
                        <span className="text-xs text-muted-foreground">Cargando créditos...</span>
                    ) : credits ? (
                        <>
                            <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                <span>{credits.remaining} / {credits.total}</span>
                            </div>

                            <Progress
                                value={usedPercent}
                                className={cn(
                                    'h-1 mt-1 transition-all duration-300',
                                    usedPercent < 30 ? 'bg-red-500' : 'bg-[#1444A1]'
                                )}
                            />
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">Sin créditos</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
