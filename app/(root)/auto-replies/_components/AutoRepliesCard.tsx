"use client";

import { rr, Workflow } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AutoRepliesActions } from "./";
import { MessageCircleMoreIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface autoReplies {
    autoReplie: rr;
    workflows: Workflow[];
}

export const AutoRepliesCard = ({ autoReplie, workflows }: autoReplies) => {
    // Filtrar workflows relacionados con este rr
    const relatedWorkflows = workflows.filter((wf) => wf.id === autoReplie.workflowId);

    return (
        <Card className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 flex items-center justify-between h-[100px]">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent">
                        <MessageCircleMoreIcon />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-base font-bold text-muted-foreground">
                            {autoReplie.mensaje}
                        </h3>

                        {/* Workflows asociados */}
                        {relatedWorkflows.length > 0 && (
                            <div className="flex gap-1 flex-wrap pt-1">
                                {relatedWorkflows.map((wf) => (
                                    <Badge key={wf.id} variant="secondary" className="text-xs">
                                        {wf.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                    <AutoRepliesActions
                        mensaje={autoReplie.mensaje ?? ""}
                        autoReplieId={autoReplie.id}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
