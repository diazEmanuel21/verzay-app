import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

export const FlowListOrder = ({ raw }: { raw: string }) => {
    const parseFlows = (value: unknown): string[] => {
        if (!value || value === "-") return [];

        const str = String(value).trim();
        if (!str) return [];

        // separa por: comas, espacios (1+), saltos de línea, pipes
        // ejemplo: "A B,C   D" -> ["A","B","C","D"]
        return str
            .replace(/\s+/g, " ") // normaliza espacios múltiples
            .split(/[,\s|\n]+/g)  // <- AQUÍ: comas o espacios (y también | o \n)
            .map((s) => s.trim())
            .filter(Boolean);
    };

    const flowsArr = parseFlows(raw)
        .map((f) => f.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es"));

    const count = flowsArr.length;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">
                        {count === 0 ? (
                            <span className="inline-flex rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
                                Sin flujos
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                                {count}
                            </span>
                        )}
                    </span>
                </TooltipTrigger>

                {count > 0 && (
                    <TooltipContent side="top" sideOffset={6} className="z-[9999] max-w-[420px]">
                        <div className="space-y-1">
                            <div className="text-xs font-medium">Flujos ({count})</div>
                            <ul className="list-disc pl-4 text-xs space-y-0.5">
                                {flowsArr.map((f, i) => (
                                    <li key={`${f}-${i}`} className="break-words">
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );

};