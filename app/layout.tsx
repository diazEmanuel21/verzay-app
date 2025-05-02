import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from '@/components/ui/sonner';

import { currentUser } from '@/lib/auth';

// import { Breadcrumbs } from '@/components/custom';
// import { AppSidebar } from '@/components/shared/Sidebar';
// import { SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';


import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Breadcrumbs } from '@/components/custom';

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
      <body className={`${poppins.className}`}>
        {isAuthenticated ? (
          <AppProviders>
            <ThemeProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar user={user} />
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex flex-1 flex-row gap-2 px-4">
                      <Breadcrumbs />
                    </div>
                  </header>
                  <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </AppProviders>
        ) : (
          // PUBLIC / AUTH LAYOUT
          <main className="flex min-h-screen w-full items-center justify-center">
            {children}
          </main>
        )}
      </body>
    </html >
  );
}