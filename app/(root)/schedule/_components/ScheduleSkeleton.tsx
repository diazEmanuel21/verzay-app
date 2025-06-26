import { Skeleton } from "@/components/ui/skeleton";


export const ScheduleSkeleton = () => {
    return (
        <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-md border border-border bg-background p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                >
                    {/* Parte izquierda (icono, hora, nombre) */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" /> {/* icono */}
                            <Skeleton className="h-4 w-36 rounded" /> {/* horario */}
                            <Skeleton className="h-4 w-28 rounded" /> {/* fecha */}
                        </div>
                        <Skeleton className="h-4 w-64 rounded" /> {/* nombre + jid */}
                    </div>

                    {/* Parte derecha (badge y botones) */}
                    <div className="flex gap-2 flex-wrap justify-end">
                        <Skeleton className="h-6 w-20 rounded-full" /> {/* badge */}
                        <Skeleton className="h-8 w-24 rounded-md" /> {/* Confirmar */}
                        <Skeleton className="h-8 w-24 rounded-md" /> {/* Cancelar */}
                    </div>
                </div>
            ))}
        </div>
    );
}