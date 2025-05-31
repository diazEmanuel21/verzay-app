"use client";

import { useState } from "react";
import { FormPromptAiProps, PromptAiFormValues } from '@/schema/ai';
import { SystemMessage } from '@prisma/client';
import { useDebounce } from '@/hooks/useDebounce';
import {
    createPromptAi,
    updatePromptAi,
    deletePromptAi,
} from "@/actions/ai-actions";
import Header from '@/components/shared/header';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skeleton } from '../../../../components/ui/skeleton';
import { AiCreatePrompt, MessageTabs } from './';

function MessagesSkeleton() {
    return (
        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
        </div>
    );
};

export const MainAi = ({ userId, promptAi }: FormPromptAiProps) => {
    const [loading, setLoading] = useState<boolean>(false);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);


    const handleSubmit = async (data: PromptAiFormValues) => {
        debugger;
        if (!promptAi) return;
        setLoading(true);
        const isEditing = promptAi.some((p) => p.id === data.id);

        try {
            let result;

            if (isEditing) {
                result = await updatePromptAi(data);
            } else {
                result = await createPromptAi(data);
            }

            if (result.success) {
                toast.success(result.message);
                setDialogOpen(false);
                setEditingId(null);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Hubo un error al procesar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (msg: SystemMessage) => {
        setEditingId(msg.id);
        setDialogOpen(true);
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
        handleDelete();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);

        try {
            const result = await deletePromptAi(deleteId);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al eliminar el mensaje");
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const filteredMessages = (promptAi ?? []).filter((msg) => {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return (
            (msg.title?.toLowerCase().includes(lowerSearch) ?? false) ||
            (msg.message?.toLowerCase().includes(lowerSearch) ?? false)
        );
    });

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 font-semibold">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const truncateMessage = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "… Ver más";
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header fijo */}
            <div className="sticky top-0 z-1 mb-6">
                <div className="flex justify-between items-center">
                    <Header
                        title={'Entrena tu IA'}
                    />
                    <AiCreatePrompt
                        loading={loading}
                        dialogOpen={dialogOpen}
                        editingId={editingId}
                        setDialogOpen={() => setDialogOpen(!dialogOpen)}
                        setEditingId={() => setEditingId(null)}
                        onSubmit={handleSubmit}
                    />
                </div>
                <Input
                    placeholder="Buscar mensaje por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Cards Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <MessagesSkeleton />
                    ) : !promptAi ? (
                        <p className="text-sm text-muted-foreground">Aún no hay mensajes configurados.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <MessageTabs
                                messages={filteredMessages}
                                debouncedSearchTerm={debouncedSearchTerm}
                                highlightMatch={highlightMatch}
                                truncateMessage={truncateMessage}
                                openEditDialog={openEditDialog}
                                confirmDelete={confirmDelete}
                                loading={loading}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}