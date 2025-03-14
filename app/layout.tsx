import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // Cambiado a Poppins
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/components/providers/AppProviders";
import { Toaster } from "@/components/ui/sonner";

// Configuración de la fuente Poppins
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Verzay IA",
  description: "La plataforma de inteligencia artificial que potencia y automatiza tu negocio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}> {/* Cambiado a poppins.className */}
        <AppProviders>
          {children}
          <Toaster position="bottom-right" richColors /> {/* Mover dentro de <body> */}
        </AppProviders>
      </body>
    </html>
  );
}
