import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/components/providers/AppProviders";
import { Toaster } from "@/components/ui/sonner";
import { ChunkRecovery } from "@/components/chunk-recovery";
import ErrorBoundary from "@/components/error-bundary";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Agente IA",
  description: "La plataforma de inteligencia artificial que potencia y automatiza tu negocio.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${poppins.className} overflow-hidden`}>
        <ErrorBoundary>
          <ChunkRecovery />
          <AppProviders>
            <ThemeProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
