"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageList } from "./MessageList";
import { ChatComposer } from "./ChatComposer";
import { useChatContext } from "../hooks/useChatContext";
import { breadcrumbLabels } from "@/components/custom";

export function ChatSheet({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const ctx = useChatContext();
    const labelFromDict = breadcrumbLabels[ctx.pathname.split('/')[1]];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-[420px] p-0">
                <div className="flex h-full flex-col">
                    <SheetHeader className="px-4 py-3 border-b">
                        <SheetTitle className="text-base">Asistente IA</SheetTitle>
                        <p className="text-xs text-muted-foreground">
                            Contexto: <span className="font-medium">{labelFromDict}</span>
                        </p>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-3 py-3">
                        <MessageList />
                    </ScrollArea>

                    <div className="border-t px-3 py-3 space-y-2">
                        {/* <QuickActions /> */}
                        <ChatComposer />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}