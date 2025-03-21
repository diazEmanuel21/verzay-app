import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // Cambiado a Poppins
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/components/providers/AppProviders";
import { Toaster } from "@/components/ui/sonner";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/shared/Sidebar";
import { Breadcrumbs } from "@/components/custom";

// Configuración de la fuente Poppins
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Verzay IA",
  description: "La plataforma de inteligencia artificial que potencia y automatiza tu negocio.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await currentUser();

  const user = await db.user.findUnique({
    where: { email: session?.email ?? '' },
  });

  if (!user) {
    return <div>No estás autenticado</div>;
  }
  type UserInfo = {
    company: string | null;
    email: string | null;
    role: string | null;
    name: string | null;
  };

  const userInformation: UserInfo = {
    company: user.company,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return (
    <html lang="en">
      <body className={`${poppins.className}bg-white text-black dark:bg-gray-900 dark:text-white`}> {/* Cambiado a poppins.className */}
        <AppProviders>
          <ThemeProvider>
            <div className="flex flex-col md:flex-row h-screen w-full bg-muted text-muted-foreground overflow-hidden">

              {/* Sidebar */}
              <div className="md:flex">
                <Sidebar userInformation={userInformation} /> {/* Pasamos el usuario aquí */}
              </div>

              {/* Main Content */}
              <div className="flex flex-col flex-1 h-full transition-all duration-300">
                <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b bg-background">
                  <Breadcrumbs />
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
                  {children}
                </main>

                {/* Optional Footer */}
                <footer className="hidden md:flex h-12 items-center justify-center border-t text-xs text-muted-foreground">
                  © 2024 Verzay. Todos los derechos reservados.
                </footer>
              </div>
            </div>
          </ThemeProvider>
          <Toaster position="bottom-right" richColors /> {/* Mover dentro de <body> */}
        </AppProviders>
      </body>
    </html>
  );
}
