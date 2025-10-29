// components/training/cards/ConsultaDatosCard.tsx
"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PropsConsultaDatos } from "@/types/agentAi";
// import { Textarea } from "@/components/ui/textarea";

export const ConsultaDatosCard: FC<PropsConsultaDatos> = ({ el, onRemove }) => {
    return (
        <Card className="bg-muted/20 border-muted/60">
            <CardHeader className="py-3 flex-row items-center justify-between">
                <CardTitle className="text-sm">Consulta de datos</CardTitle>
                <Button variant="ghost" size="icon" onClick={onRemove}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            {/* Si quieres mostrar el snippet agregado:
      <CardContent className="space-y-2">
        <label className="text-xs font-medium">Snippet agregado:</label>
        <Textarea value={el.prompt ?? ""} readOnly className="min-h-[64px]" />
      </CardContent>
      */}
            <CardContent />
        </Card>
    );
};