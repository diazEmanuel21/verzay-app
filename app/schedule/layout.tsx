import type { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
    title: "Agendar cita | IA Agent",
    description: "Programa una cita personalizada con nuestro asesor",
};

export default function PublicScheduleLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <main className="min-h-screen bg-muted/40">
            <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="mb-6 text-center">
                    <Image
                        src="/logo-iaagent.png"
                        alt="IA Agent Logo"
                        width={100}
                        height={100}
                        className="mx-auto rounded-full border shadow"
                    />
                    <h1 className="mt-4 text-2xl font-bold tracking-tight">Agendamiento de citas</h1>
                    <p className="text-sm text-muted-foreground">
                        Reserva una cita en el horario que más te convenga.
                    </p>
                </div>

                <ScrollArea className="w-full max-w-2xl h-[70vh] p-6 rounded-md shadow-md">
                    {children}
                </ScrollArea>
            </div>
        </main>
    );
}