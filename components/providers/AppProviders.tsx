"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function AppProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient)

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"      // Tema por defecto si no hay preferencia guardada
                enableSystem={true}        // Habilita el modo 'system' para seguir el tema del SO
                disableTransitionOnChange={true} // Opcional: evita animaciones molestas al cambiar de tema
            >
                {children}
            </ThemeProvider>
            <ReactQueryDevtools />
        </QueryClientProvider>
    )

}