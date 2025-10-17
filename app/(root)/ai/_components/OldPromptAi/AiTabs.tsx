'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { TYPE_AI_LABELS } from '@/schema/ai'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface PromptPreviewDialogProps {
    promptFormatted: string;
}

export const AiTabs = ({
    onTabChange,
    promptFormatted,
}: {
    onTabChange?: (tab: string) => void
    promptFormatted: string
}) => {
    const [activeTab, setActiveTab] = useState<string>(Object.keys(TYPE_AI_LABELS)[0])
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleTabClick = (key: string) => {
        setActiveTab(key)
        onTabChange?.(key)
    }

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const scrollAmount = 150
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className="w-full">
            {/* Controles móviles */}
            <div className="flex justify-between">
                <Button variant="ghost" size="icon" onClick={() => scroll('left')} className=" sm:hidden">
                    <ArrowLeft />
                </Button>

                <div
                    ref={scrollRef}
                    className={cn(
                        'flex overflow-x-auto gap-2 pb-1 scrollbar-none',
                        'sm:overflow-visible sm:justify-start sm:flex-wrap'
                    )}
                >
                    {Object.entries(TYPE_AI_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => handleTabClick(key)}
                            className={cn(
                                'px-4 py-2 rounded-t-md font-medium text-sm border-b-2 transition-colors duration-150 whitespace-nowrap',
                                activeTab === key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                     <PromptPreviewDialog promptFormatted={promptFormatted} />
                </div>

                <Button variant="ghost" size="icon" onClick={() => scroll('right')} className=" sm:hidden">
                    <ArrowRight />
                </Button>
            </div>
        </div>
    )
}


export const PromptPreviewDialog = ({ promptFormatted }: PromptPreviewDialogProps) => {
    const [open, setOpen] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(promptFormatted);
            toast.success("Copiado al portapapeles");
        } catch {
            toast.error("No se pudo copiar");
        }
    };

    return (
        <>
            {/* Botón principal para abrir el diálogo */}
            <Button variant="outline" onClick={() => setOpen(true)}>
                Previsualizar
            </Button>

            {/* Diálogo de vista previa */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] p-0 flex flex-col">
                    <DialogHeader className="px-6 pt-6 pb-3 border-b">
                        <DialogTitle className="flex items-center justify-between w-full">
                            Vista previa del prompt
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCopy}
                                className="gap-1 hover:bg-muted"
                            >
                                <Copy className="w-4 h-4" />
                                Copiar
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Contenido del prompt (solo lectura) */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 bg-muted/30 rounded-md text-sm font-mono whitespace-pre-wrap leading-relaxed">
                        {promptFormatted || "No hay contenido para mostrar."}
                    </div>

                    <DialogFooter className="px-6 py-3 border-t">
                        <Button variant="secondary" onClick={() => setOpen(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
