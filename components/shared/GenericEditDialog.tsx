"use client";

import { useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CustomDialogHeader from "@/components/shared/CustomDialogHeader";
import { LucideIcon } from "lucide-react";

interface GenericEditDialogProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
    triggerText?: string;
    icon?: LucideIcon;
    title: string;
    subTitle?: string;
    children: ReactNode;
    buttonVariant?: "default" | "outline" | "ghost" | "link" | "secondary";
    buttonClassName?: string;
    hideTrigger?: boolean;
}

export const GenericEditDialog = ({
    open,
    setOpen,
    triggerText = "Editar",
    icon,
    title,
    subTitle,
    children,
    buttonVariant = "default",
    buttonClassName,
    hideTrigger = false,
}: GenericEditDialogProps) => {
    // Comportamiento controlado vs interno
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined && setOpen !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const handleOpenChange = isControlled ? setOpen! : setInternalOpen;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {!hideTrigger && (
                <DialogTrigger asChild>
                    <Button variant={buttonVariant} className={buttonClassName}>
                        {triggerText.toUpperCase()}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <CustomDialogHeader icon={icon} title={title} subTitle={subTitle} />
                {children}
            </DialogContent>
        </Dialog>
    );
};
