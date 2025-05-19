'use client';

import { useEffect, useState } from 'react';
import { redirect, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@prisma/client';
import { navLinks } from '@/constants/navLinks';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar';

import ThemeSwitcher from '../custom/ThemeSwitcher';
import LogoutButton from '../logout-button';
import { PremiumModule } from './PremiumModule';
import { canAccessRoute, getRouteAccess } from '@/utils/access';
import { toast } from 'sonner';
import { Label } from '@radix-ui/react-label';
import { BotMessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { CreditsWidget } from '../custom';

interface AppSidebarProps {
  user: User
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isAssigned, setUserAssignedToReseller] = useState(false);

  useEffect(() => {
    if (!user) {
      redirect('/login');
    }
  }, []);

  return (
    <Sidebar className="bg-white dark:bg-gray-900 text-gray-800 dark:text-zinc-100 border-r border-zinc-200 dark:border-gray-800">
      {/* HEADER */}
      <SidebarHeader className="flex items-center justify-center py-4">
        {user.role === 'reseller' || isAssigned ?
          <div className="flex items-center gap-2 text-center">
            <Label
              className={clsx(
                "text-2xl font-extrabold tracking-wide",
                "text-blue-600 drop-shadow-sm",
                "uppercase font-mono"
              )}
            >
              AGENTE IA
            </Label>
            <BotMessageSquare className="text-blue-500 w-6 h-6 animate-bounce" />
          </div>
          :
          <Link href="/">
            <Image
              src="/assets/image/logo_app.png"
              alt="logo"
              width={140}
              height={28}
              className="cursor-pointer"
            />
          </Link>
        }
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="flex-1 flex flex-col gap-2">

        <SidebarGroup title="Menú" className='flex flex-1'>
          {navLinks
            .filter(link => link.showInSidebar)
            .filter(link => {
              const access = getRouteAccess(link.route);
              // Mostrar solo si no es adminOnly o el usuario es admin
              return !access?.adminOnly || user.role === 'admin' || user.role === 'reseller';
            })
            .map((link) => {
              const { route, icon: Icon, label, requiresPremium } = link;

              const isActive =
                pathname === route || (route !== '/' && pathname.startsWith(route));

              const handleClick = (e: React.MouseEvent) => {
                const access = getRouteAccess(route);
                const canIget = canAccessRoute({
                  route,
                  userRole: user.role,
                  userPlan: user.plan,
                });
                // Validación de acceso por plan/admin (pero solo redirige, no oculta)
                if (
                  access &&
                  !canIget.allowed
                ) {
                  e.preventDefault();
                  toast.info("Acceso limitado. Actualiza tu plan para desbloquear esta función premium.");
                  router.push('/credits');
                }
              };

              return (
                <>
                  {route === '/profile' &&
                    <div className="credits-container flex flex-1 flex-col items-center justify-end">
                      <CreditsWidget userId={user.id} webhookUrl={user?.webhookUrl ?? ''} />
                    </div>}
                  <Link
                    key={route}
                    href={user.role === 'reseller' && route === '/admin' ? '/admin/clientes' : route}
                    onClick={handleClick}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    <span className="flex items-center gap-1">
                      <Icon
                        className={`${isActive ? 'invert brightness-200' : ''} h-5`}
                      />
                      {label}
                    </span>
                    {requiresPremium && <PremiumModule />}
                  </Link>
                </>
              );
            })}
        </SidebarGroup>

      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="flex flex-col gap-4 p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Tema</span>
          <ThemeSwitcher />
        </div>
        <LogoutButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
