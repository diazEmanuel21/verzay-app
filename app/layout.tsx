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
import AppInitializer from '@/components/custom/AppInitializer';
import { getResellerProfileForUser } from '@/actions/reseller-action';
// import { AppSidebar } from '@/components/shared/Sidebar';

// Fuente
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

//Generic class 
const themeClass = "bg-slate-100 text-black dark:bg-gray-900 dark:text-white";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Verzay IA',
  description: 'La plataforma de inteligencia artificial que potencia y automatiza tu negocio.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const isAuthenticated = !!user?.id;
  const onReseller = isAuthenticated
    ? await getResellerProfileForUser(user.id)
    : { success: false, message: "Sin sesión activa" };
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <html lang="en">
      <body className={`${poppins.className} overflow-hidden ${themeClass}`}>
        <AppProviders>
          <ThemeProvider>
            <AppInitializer onReseller={onReseller} />
            {isAuthenticated ? (
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar user={user} />
                <SidebarInset className="h-screen flex flex-col">

                  {/* Header fijo, pero ocupa espacio */}
                  <div className="h-18 shrink-0">
                    <header className={`sticky top-0 h-18 w-full border border-border flex items-center px-4 ${themeClass}`}>
                      <Breadcrumbs />
                    </header>
                  </div>

                  {/* Main con scroll interno */}
                  <main className={`flex-1 overflow-auto p-4 ${themeClass}`}>
                    {children}
                  </main>

                </SidebarInset>
              </SidebarProvider>
            ) : (
              // PUBLIC / AUTH LAYOUT
              <main className={`flex min-h-screen w-full items-center justify-center ${themeClass}`}>
                {children}
              </main>
            )}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </AppProviders>

      </body>
    </html >
  );
}