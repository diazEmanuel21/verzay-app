"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { PromptPreviewInterface } from "@/types/agentAi";

export const PromptPreview = ({ prompt }: PromptPreviewInterface) => {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt || "");
            toast.success("Texto copiado al portapapeles");
        } catch {
            try {
                const ta = document.createElement("textarea");
                ta.value = prompt || "";
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                toast.success("Texto copiado al portapapeles");
            } catch {
                toast.error("No se pudo copiar el texto");
            }
        }
    };

    return (
        <Card className="border-none">
            <CardContent className="p-0">
                <div className="relative">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        aria-label="Copiar texto"
                        className="absolute right-5 top-2 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>

                    <Textarea
                        readOnly
                        className="min-h-[540px] font-mono text-sm pr-14"
                        value={prompt}
                    />
                </div>
            </CardContent>
        </Card>
    );
};