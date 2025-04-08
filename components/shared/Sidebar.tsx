'use client';

import { useEffect } from 'react';
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
import { Crown } from 'lucide-react';

interface AppSidebarProps {
  user: User
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();


  useEffect(() => {
    if (!user) {
      redirect('/login');
    }
  }, []);

  return (
    <Sidebar className="bg-white dark:bg-gray-900 text-gray-800 dark:text-zinc-100 border-r border-zinc-200 dark:border-gray-800">
      {/* HEADER */}
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href="/">
          <Image
            src="/assets/image/logo2.svg"
            alt="logo"
            width={140}
            height={28}
            className="cursor-pointer"
          />
        </Link>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="flex-1 flex flex-col gap-2">
        <SidebarGroup title="Menú">
          {navLinks.map(({ route, icon: Icon, label, adminOnly, premium }) => {
            if (adminOnly && user.role !== 'admin') return null;

            const isActive = pathname === route || (route !== '/' && pathname.startsWith(route));

            const handleClick = (e: React.MouseEvent) => {
              if (route === '/flow') {
                const allowedRoles = ['empresarial', 'business'];
                if (!allowedRoles.includes(user.role)) {
                  e.preventDefault();
                  router.push('/credits');
                }
              }
            };

            return (
              <Link
                key={route}
                href={route}
                onClick={handleClick}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                  ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
              >
                <span className="flex items-center gap-1">
                  <Icon className={`${isActive ? 'invert brightness-200' : ''} h-5`} />
                  {label}
                </span>
                {premium && (
                  <Crown className="h-3 w-3 text-yellow-400" />
                )}
              </Link>
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
