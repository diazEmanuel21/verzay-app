"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useChatStore } from "@/stores/ai-chat/useChatStore";
import { HelpCircle, MessageCircle, Search } from "lucide-react";

export function ChatOnboardingModal() {
    const open = useChatStore((s) => s.showOnboarding);
    const setOpen = useChatStore((s) => s.setShowOnboarding);
    const initOnboarding = useChatStore((s) => s.initOnboarding);
    const hideOnboardingForever = useChatStore((s) => s.hideOnboardingForever);
    const setChatOpen = useChatStore((s) => s.setOpen);

    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        initOnboarding();
    }, [initOnboarding]);

    const close = () => {
        if (dontShowAgain) {
            hideOnboardingForever();
            return;
        }
        setOpen(false);
    };

    const go = () => {
        close();
        setChatOpen(true);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[760px]">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl">Guía rápida</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Si tienes dudas sobre cómo hacer algo en la app, usa el chat y te guío paso a paso.
                    </p>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <TipCard
                        icon={<HelpCircle className="h-5 w-5" />}
                        title="Pregúntame lo que necesitas"
                        text="Ejemplos: “¿Cómo cambio el nombre de un lead?” o “¿Dónde veo los chats?”"
                    />
                    <TipCard
                        icon={<Search className="h-5 w-5" />}
                        title="Te digo dónde está"
                        text="Te indicaré la ruta exacta y los pasos para llegar al lugar correcto."
                    />
                    <TipCard
                        icon={<MessageCircle className="h-5 w-5" />}
                        title="Respuestas claras"
                        text="Si falta un dato, te haré una sola pregunta para ayudarte más rápido."
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                        <Checkbox
                            checked={dontShowAgain}
                            onCheckedChange={(v) => setDontShowAgain(v === true)}
                        />
                        No volver a mostrar
                    </label>

                    <Button onClick={go} className="sm:w-auto w-full">
                        Bien, vamos.
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TipCard({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-xl border p-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div className="space-y-1">
                    <div className="font-medium">{title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
            </div>
        </div>
    );
}