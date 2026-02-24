"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const ChatLauncher = ({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) => {
    return (
        <div className="fixed bottom-4 right-4 z-50">
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
    );
}