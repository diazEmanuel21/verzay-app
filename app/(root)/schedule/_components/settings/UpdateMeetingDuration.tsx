"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { updateUserMeetingDuration } from "@/actions/userClientDataActions";

// Componente para actualizar la duración de la reunión
export const UpdateMeetingDuration = ({ userId }: { userId: string }) => {
    const [duration, setDuration] = useState<number | string>(""); // Estado para la duración
    const [loading, setLoading] = useState(false);

    // Mutación para actualizar la duración
    const mutation = useMutation({
        mutationFn: (newDuration: number) => updateUserMeetingDuration(userId, newDuration),
        onSuccess: () => {
            toast.success("Duración de reunión actualizada correctamente");
            setLoading(false);
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al actualizar la duración");
            setLoading(false);
        },
    });

    // Validación de entrada (solo valores numéricos y dentro del rango permitido)
    const validateDuration = (value: string) => {
        const parsedValue = parseInt(value);
        if (parsedValue < 1 || parsedValue > 480 || isNaN(parsedValue)) {
            return "La duración debe ser un número entre 1 y 480 minutos.";
        }
        return "";
    };

    // Manejar el cambio de la duración
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDuration(e.target.value);
    };

    // Manejar el envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateDuration(duration.toString());
        if (error) {
            toast.error(error);
            return;
        }
        setLoading(true);
        mutation.mutate(Number(duration));
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-xl font-semibold text-center">Actualizar Duración de Reunión</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        Duración de la reunión (minutos)
                    </label>
                    <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={handleChange}
                        min="1"
                        max="480"
                        placeholder="Ingrese la duración en minutos"
                        className="mt-1"
                    />
                </div>

                <div className="flex justify-center">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "Actualizando..." : "Actualizar Duración"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
