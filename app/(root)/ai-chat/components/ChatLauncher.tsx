"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, MessageCircle, Sparkles } from "lucide-react";

export const ChatLauncher = ({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) => {
    return (
        <>
            <div className="fixed bottom-4 right-4 z-50 sm:hidden">
                <Button
                    type="button"
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg"
                    onClick={() => onOpenChange(!open)}
                    aria-label="Abrir chat"
                >
                    <MessageCircle className="h-5 w-5" />
                </Button>
            </div>

            <div className="pointer-events-none fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 sm:block">
                <div
                    className={cn(
                        "group pointer-events-auto flex items-center transition-transform duration-300 ease-out",
                        open ? "translate-x-0" : "translate-x-[calc(100%-3.5rem)] hover:translate-x-0",
                    )}
                >
                    <div className="flex items-center gap-3 rounded-l-2xl border border-r-0 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>

                        <div className="min-w-[180px]">
                            <p className="text-sm font-semibold text-foreground">Asistente IA</p>
                            <p className="text-xs text-muted-foreground">
                                Ayuda contextual y respuestas rapidas
                            </p>
                        </div>

                        <Button
                            type="button"
                            className="h-11 rounded-xl px-4"
                            onClick={() => onOpenChange(!open)}
                            aria-label="Abrir asistente IA"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {open ? "Ocultar" : "Abrir"}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
