'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { navLinks } from '@/constants';
import { User } from '@prisma/client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar';

import ThemeSwitcher from '../custom/ThemeSwitcher';
import LogoutButton from '../logout-button';

type AppSidebarProps = {
  user: User;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
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
      <SidebarContent className="flex-1 flex flex-col gap-2 px-2">
        <SidebarGroup title="Menú">
          {navLinks.map((link) => {
            const isActive = pathname === link.route || (link.route !== '/' && pathname.startsWith(link.route));
            return (
              <Link
                key={link.route}
                href={link.route}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Image
                  src={link.icon}
                  alt={link.label}
                  width={20}
                  height={20}
                  className={isActive ? 'invert brightness-200' : ''}
                />
                {link.label}
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
