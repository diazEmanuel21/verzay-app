'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plan, User } from '@prisma/client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
// import { PLAN_COLORS } from '@/types/plans'

type LogoutButtonProps = {
  user: User | null
  collapsed?: boolean
};

const LogoutButton = ({ user }: LogoutButtonProps) => {
  const router = useRouter();
  const { isMobile } = useSidebar()

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/login',
    })
  }

  const goTo = (path: string) => router.push(path)

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?'

  const PLAN_COLORS: Record<Plan, string> = {
    standard: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',       // Básico → neutral
    intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300', // Nivel medio → más cálido
    advanced: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300', // Alto nivel → sofisticado
    pymes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',   // Comercial → accesible
    business: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',           // Corporativo → estable
    empresarial: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300', // Élite → confianza y prestigio
  };

  const customStyles = PLAN_COLORS[user?.plan ?? 'pymes'];
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user?.image && <AvatarImage src={user?.image} alt={user?.name ?? ''} />}
                <AvatarFallback className="rounded-lg">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className={`truncate text-xs capitalize p-1 rounded-sm  ${customStyles}`}>
                  {user?.plan}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user?.image && <AvatarImage src={user?.image} alt={user?.name ?? ''} />}
                  <AvatarFallback className="rounded-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => goTo('/credits')}>
                <Sparkles />
                Mejorar mi plan
              </DropdownMenuItem>
            </DropdownMenuGroup> */}
            {/* <DropdownMenuSeparator /> */}
            {/* <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => goTo('/profile')}>
                <BadgeCheck />
                Ajustes de perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

  )
}

export default LogoutButton
