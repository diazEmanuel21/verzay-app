'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Mail } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { User } from '@prisma/client';

type SidebarProps = {
  user: User | null;
};

const LogoutButton = ({ user }: SidebarProps) => {
  const handleClick = async () => {
    await signOut({
      callbackUrl: '/login',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          {user?.company}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <span className="text-sm font-medium">{user?.email}</span>
          <span className="text-xs text-muted-foreground">
            {user?.role}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Instancia: <span className="ml-auto">{user?.name?.split('-')[1]}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleClick}
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LogoutButton;