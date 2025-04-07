'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User } from '@prisma/client'
import Image from 'next/image'
import { cn } from '@/lib/utils'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from 'lucide-react'

type LogoutButtonProps = {
  user: User | null
  collapsed?: boolean
}

const LogoutButton = ({ user, collapsed = false }: LogoutButtonProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/login',
    })
  }

  const goTo = (path: string) => router.push(path)

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?'

  const renderAvatar = (size: number) => {
    if (user?.image) {
      return (
        <Image
          src={user.image}
          alt="Avatar"
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      )
    }

    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium"
      >
        {userInitial}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start px-3 py-2 hover:bg-muted',
            collapsed && 'justify-center'
          )}
        >
          {renderAvatar(28)}
          {!collapsed && (
            <div className="ml-3 text-left">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">
                {user?.email}
              </div>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center space-x-2">
          {renderAvatar(32)}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name ?? 'Usuario'}</span>
            <span className="text-xs text-muted-foreground">
              {user?.email ?? 'correo@correo.com'}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <Sparkles className="mr-2 h-4 w-4" />
          Actualízate a Pro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => goTo('/profile')}>
          <BadgeCheck className="mr-2 h-4 w-4" />
          Cuenta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => goTo('/credits')}>
          <CreditCard className="mr-2 h-4 w-4" />
          Planes
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Bell className="mr-2 h-4 w-4" />
          Notificaciones
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LogoutButton
