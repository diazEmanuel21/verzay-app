'use client';

import { useState } from 'react';
import { navLinks } from '@/constants';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '../logout-button';
import ThemeSwitcher from '../custom/ThemeSwitcher';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type UserInfo = {
  company: string | null;
  email: string | null;
  role: string | null;
  name: string | null;
};

type SidebarProps = {
  userInformation: UserInfo;
};

const Sidebar = ({ userInformation }: SidebarProps) => {

  const pathname = usePathname();

  // Estado para el menú en móvil (Sheet)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Ancho dinámico del sidebar
  const sidebarWidth = '240px';

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
          <Image
            src="/assets/image/logo2.svg"
            alt="logo"
            width={140}
            height={28}
          />
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-6">
        <Card className="bg-transparent border-none shadow-none">
          <CardContent className="p-0">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.route || (link.route !== '/' && pathname.startsWith(link.route));
                return (
                  <li key={link.route}>
                    <Link
                      href={link.route}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                        ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                      <Image
                        src={link.icon}
                        alt={link.label}
                        width={20}
                        height={20}
                        className={`${isActive ? 'invert brightness-200' : ''}`}
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </nav>

      {/* Footer */}
      <div className={`flex flex-col gap-4 px-4`}>

        <LogoutButton userInformation={userInformation} />
        <div className={`flex items-center justify-between w-full}`}>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Tema</span>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="flex justify-between items-center px-4 py-2 bg-white dark:bg-zinc-900 border-b md:hidden">
        <Link href="/" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
          <Image src="/assets/image/logo2.svg" alt="logo" width={120} height={23} />
        </Link>

        <div className="flex items-center gap-2">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
                <Image src="/assets/icons/menu.svg" alt="menu" width={24} height={24} />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="sm:w-64 z-50 p-4 bg-white dark:bg-zinc-900">
              {SidebarContent()}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <div
        className="hidden md:flex h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-sm p-4 transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        {SidebarContent()}
      </div>
    </>
  );
};

export default Sidebar;