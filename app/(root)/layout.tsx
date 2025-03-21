import Sidebar from '@/components/shared/Sidebar';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import React from 'react';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await currentUser();

  const user = await db.user.findUnique({
    where: { email: session?.email ?? '' },
  });

  if (!user) {
    return <div className="flex items-center justify-center h-screen">No estás autenticado</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-muted text-muted-foreground overflow-hidden">

      {/* Sidebar */}
      <div className="md:fle">
        <Sidebar userInformation={user} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full transition-all duration-300">
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
  );
};

export default Layout;
