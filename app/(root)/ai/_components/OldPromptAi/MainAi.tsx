"use client";

import { useState } from "react";
import { FormPromptAiProps, PromptAiFormValues, TYPE_AI_LABELS } from '@/schema/ai';
import { SystemMessage, TypePromptAi } from '@prisma/client';
import { useDebounce } from '@/hooks/useDebounce';
import Header from '@/components/shared/header';
import { Input } from '@/components/ui/input';
import { AiTabs, MessageTabs, PromptDialog } from "./";
import { GenericDeleteDialog } from "@/components/shared/GenericDeleteDialog";
import { deletePromptAi, deletePromptAiByUserId } from "@/actions/ai-actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";

export function formatPromptByType(promptAi: any[], type: string) {
    const filtered = (promptAi ?? []).filter((m) => m.typePrompt === type);
    return formatPromptArray(filtered);
}

export function formatPromptArray(data: any): string {
    // Verificamos que sea un array válido
    if (!Array.isArray(data)) {
        throw new Error('El parámetro recibido no es un array válido.');
    }

    // Creamos el resultado acumulado
    let result = '';

    // Iteramos por cada elemento del array
    data.forEach((item) => {
        const title = typeof item.title === 'string' ? item.title.trim() : 'Sin título';
        const message = typeof item.message === 'string' ? item.message.trim() : '';

        // Concatenamos con saltos de línea
        result += `${title}\n${message}\n\n`;
    });

    // Retornamos el texto limpio sin espacios al final
    return result.trim();
}

export const MainAi = ({ promptAi, userId }: FormPromptAiProps) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [delTraining, setDelTraining] = useState<boolean>(false);
    const [editingData, setEditingData] = useState<PromptAiFormValues | null>(null);
    const [dataDelete, setDataDelete] = useState<PromptAiFormValues | null>(null);
    const [activeTab, setActiveTab] = useState<TypePromptAi>(TypePromptAi.TRAINING);

    const trainingPromptFormatted = formatPromptByType(promptAi ?? [], "TRAINING");
    const faqsPromptFormatted = formatPromptByType(promptAi ?? [], "FAQs");

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const openCreateDialog = () => {
        setEditingData({
            title: '',
            message: '',
            userId,
            typePrompt: 'TRAINING'
        });
        setDialogOpen(true);
    };

    const openEditDialog = (msg: SystemMessage) => {
        setEditingData({
            id: msg.id,
            message: msg.message,
            title: msg.title,
            typePrompt: msg.typePrompt ?? 'TRAINING',
            userId: msg.userId
        });
        setDialogOpen(true);
    };

    const filteredMessages = (promptAi ?? []).filter((msg) => {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return (
            msg.title?.toLowerCase().includes(lowerSearch) ||
            msg.message?.toLowerCase().includes(lowerSearch)
        );
    });

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
            ) : (
                part
            )
        );
    };

    const truncateMessage = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "… Ver más";
    };

    const onTabChange = (tab: string) => {
        setActiveTab(tab as TypePromptAi)
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-1 mb-4">
                <div className="flex justify-between items-center pb-2">
                    <Header title={'Entrena tu IA'} />

                    <button
                        onClick={openCreateDialog}
                        className="bg-primary text-white px-4 py-2 rounded-md"
                    >
                        Crear
                    </button>
                </div>
                {/* SEARCH */}
                <Input
                    placeholder="Buscar mensaje por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm mb-2"
                />
                {/* TABS */}
                <div className="flex flex-1 ">
                    <AiTabs
                        onTabChange={onTabChange}
                        promptsByTab={{
                            TRAINING: trainingPromptFormatted,
                            FAQs: faqsPromptFormatted,
                        }}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
                                <Ellipsis />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDelTraining(true)}
                            >
                                Eliminar entrenamiento
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Scroll interno para el content */}
            <div className="flex-1 overflow-y-auto">
                <MessageTabs
                    messages={filteredMessages}
                    debouncedSearchTerm={debouncedSearchTerm}
                    highlightMatch={highlightMatch}
                    truncateMessage={truncateMessage}
                    openEditDialog={openEditDialog}
                    activeTab={activeTab}
                    setDeleteDialogOpen={setDeleteDialogOpen}
                    setDataDelete={setDataDelete}
                />
            </div>
            {/* Modal reutilizable */}
            <PromptDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                defaultValues={editingData}
                userId={userId}
            />
            {
                dataDelete &&
                <GenericDeleteDialog
                    open={deleteDialogOpen}
                    setOpen={setDeleteDialogOpen}
                    itemId={dataDelete.id ?? ''}
                    mutationFn={() => deletePromptAi(dataDelete.id ?? '')}
                    entityLabel={dataDelete.title}
                />
            }

            {/* Dialog to delete all trainig */}
            <GenericDeleteDialog
                open={delTraining}
                setOpen={setDelTraining}
                itemName="Entrenamiento IA"
                // itemId={module.id}
                itemId={userId}
                mutationFn={() => deletePromptAiByUserId(userId)}
                entityLabel="Todo el entrenamiento IA"
            />
        </div>
    );
};


