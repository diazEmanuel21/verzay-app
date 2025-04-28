import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from '@/components/ui/sonner';

import { currentUser } from '@/lib/auth';

import { Breadcrumbs } from '@/components/custom';
import { AppSidebar } from '@/components/shared/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

// Fuente
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'Verzay IA',
  description: 'La plataforma de inteligencia artificial que potencia y automatiza tu negocio.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const isAuthenticated = user !== null && user !== undefined;
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <html lang="en">
      <body className={`${poppins.className} bg-white text-black dark:bg-gray-900 dark:text-white`}>
        <AppProviders>
          <ThemeProvider>
            {isAuthenticated ? (
              <div className="flex flex-col md:flex-row h-screen w-full bg-muted text-muted-foreground">
                {/* Sidebar */}
                <SidebarProvider defaultOpen={defaultOpen}>
                  <AppSidebar user={user} />

                  {/* Main Content */}
                  <div className="flex flex-col flex-1 h-full transition-all duration-300">
                    <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b bg-background">
                      <Breadcrumbs />
                    </header>
                    <main className="flex-1 p-2">
                      {children}
                    </main>
                    {/* <footer className="pt-2 hidden md:flex items-center justify-center border-t text-xs text-muted-foreground">
                      © 2025 Verzay. Todos los derechos reservados.
                    </footer> */}
                  </div>
                </SidebarProvider>
              </div>
            ) : (
              // PUBLIC / AUTH LAYOUT
              <main className="flex min-h-screen w-full items-center justify-center">
                {children}
              </main>
            )}
          </ThemeProvider>
          <Toaster position="bottom-right" richColors />
        </AppProviders>
      </body>
    </html>
  );
}
