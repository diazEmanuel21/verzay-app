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
import { AppSidebar } from "@/components/app-sidebar"
import AppInitializer from '@/components/custom/AppInitializer';
import { getResellerProfileForUser } from '@/actions/reseller-action';
import { getAllModules } from '@/actions/module-actions';
import AppSkeleton from '@/components/custom/AppSkeleton';
import { Breadcrumbs } from '@/components/custom';
import { ChunkRecovery } from '@/components/chunk-recovery';
import ErrorBoundary from '@/components/error-bundary';
// import { CommunityBanner } from '@/components/shared/CommunityBanner';

// Fuente
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

//Generic class 
const themeClass = "bg-slate-100 text-black dark:bg-black dark:text-white";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Agente IA',
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
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  // Obtener módulos solo si hay sesión
  const modules = isAuthenticated
    ? (await getAllModules()).data ?? []
    : [];

  const loading = isAuthenticated && (!user || modules.length === 0);

  if (loading) {
    return <AppSkeleton />;
  }

  return (
    <html lang="es">
      <body className={`${poppins.className} overflow-hidden`}>
        <ErrorBoundary>
          <ChunkRecovery />
          <AppProviders>
            <ThemeProvider>
              <AppInitializer onReseller={onReseller} modules={modules} user={user} />
              {/* <CommunityBanner /> */}
              {isAuthenticated ? (
                <SidebarProvider defaultOpen={defaultOpen}>
                  <AppSidebar user={user} />
                  <SidebarInset className="h-screen flex flex-col">
                    {/* Header fijo, pero ocupa espacio */}
                    <Breadcrumbs />
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
        </ErrorBoundary>
      </body>
    </html >
  );
}