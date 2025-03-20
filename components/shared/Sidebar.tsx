"use client";

import { navLinks } from '@/constants';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@prisma/client';
import { usePathname } from 'next/navigation';
import LogoutButton from '../logout-button';

type userInterfaceProps = {
  userInformation: User;
};


const Sidebar = ({ userInformation }: userInterfaceProps) => {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="flex size-full flex-col gap-4">
        <Link href="/" className="sidebar-logo">
          <Image src="/assets/image/logo2.svg" alt="logo" width={140} height={28} />
        </Link>

        <nav className="sidebar-nav">
          <ul className="sidebar-nav_elements">
            {navLinks.slice(0, 5).map((link) => {
              // Actualización de lógica para rutas activas
              const isActive = pathname === link.route || (link.route !== '/' && pathname.startsWith(link.route));

              return (
                <li
                  key={link.route}
                  className={`sidebar-nav_element group ${isActive ? 'bg-purple-gradient text-white' : 'text-gray-700'
                    }`}
                >
                  <Link className="sidebar-link" href={link.route}>
                    <Image
                      src={link.icon}
                      alt="logo"
                      width={24}
                      height={24}
                      className={`${isActive && 'brightness-200'}`}
                    />
                    {link.label}
                  </Link>
                </li>
              );
            })}

          </ul>


          <ul className="sidebar-nav_elements">
            {navLinks.slice(5).map((link) => {
              const isActive = link.route === pathname

              return (
                <li key={link.route} className={`sidebar-nav_element group ${isActive ? 'bg-purple-gradient text-white' : 'text-gray-700'
                  }`}>
                  <Link className="sidebar-link" href={link.route}>
                    <Image
                      src={link.icon}
                      alt="logo"
                      width={24}
                      height={24}
                      className={`${isActive && 'brightness-200'}`}
                    />
                    {link.label}
                  </Link>
                </li>
              )
            })}
            <LogoutButton userInformation={userInformation} />
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
