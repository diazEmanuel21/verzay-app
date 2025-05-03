import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from '@/components/ui/sonner';
import { currentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Breadcrumbs } from '@/components/custom';
import { AppSidebar } from "@/components/app-sidebar"
// import { AppSidebar } from '@/components/shared/Sidebar';

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
      <body className={`${poppins.className} overflow-x-hidden bg-slate-100 text-black dark:bg-gray-900 dark:text-white`}>
        {isAuthenticated ? (
          <AppProviders>
            <ThemeProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar user={user} />
                <SidebarInset className="h-screen flex flex-col">

                  {/* Header fijo, pero ocupa espacio */}
                  <div className="h-16 shrink-0">
                    <header className="sticky top-0 h-16 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white-100/60 dark:supports-[backdrop-filter]:bg-gray-900/60 flex items-center px-4">
                      <Breadcrumbs />
                    </header>
                  </div>

                  {/* Main con scroll interno */}
                  <main className="flex-1 overflow-auto p-4 bg-slate-100 text-black dark:bg-gray-900 dark:text-white">
                    {children}
                  </main>

                </SidebarInset>
              </SidebarProvider>
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </AppProviders>
        ) : (
          // PUBLIC / AUTH LAYOUT
          <main className="flex min-h-screen w-full items-center justify-center bg-slate-100 text-black dark:bg-gray-900 dark:text-white">
            {children}
          </main>
        )}
      </body>
    </html >
  );
}