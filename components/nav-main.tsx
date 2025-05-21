'use client';

import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';

import { canAccessRoute, getRouteAccess } from '@/utils/access';
import { navLinks } from '@/constants/navLinks';
import { PremiumModule } from './shared/PremiumModule';

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import {
    BookOpenIcon
} from "@heroicons/react/24/solid";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import Link from 'next/link';
import { User } from '@prisma/client';
import clsx from 'clsx';

export function NavMain({ user }: { user: User }) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = navLinks
        .filter(link => link.showInSidebar)
        .filter(link => {
            const access = getRouteAccess(link.route);
            return !access?.adminOnly || user.role === 'admin' || user.role === 'reseller';
        })
        .map(link => {
            const isActive = pathname === link.route || pathname.startsWith(link.route);
            return { ...link, isActive };
        });

    return (
        <SidebarGroup>
            {/* <SidebarGroupLabel>Módulos</SidebarGroupLabel> */}
            <SidebarMenu>
                {navItems.map((item) => {
                    const { route, icon: Icon, label, requiresPremium, isActive, items } = item;

                    const handleClick = (e: React.MouseEvent) => {
                        const access = getRouteAccess(route);
                        const canIget = canAccessRoute({
                            route,
                            userRole: user.role,
                            userPlan: user.plan,
                        });

                        if (access && !canIget.allowed) {
                            e.preventDefault();
                            toast.info('Acceso limitado. Actualiza tu plan para desbloquear esta función premium.');
                            router.push('/credits');
                        }
                    };

                    const linkClasses = clsx(
                        'flex items-center justify-between py-2 rounded-md text-sm font-medium transition',
                        isActive
                            ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    );

                    const iconClasses = clsx(
                        'h-5',
                        isActive && 'invert brightness-200'
                    );

                    const targetRoute = user.role === 'reseller' && route === '/admin' ? '/admin/clientes' : route;

                    // Si NO hay subitems, renderizar directamente como link
                    if (!items || items.length === 0) {
                        return (
                            <SidebarMenuItem key={route}>
                                <SidebarMenuButton className={linkClasses} tooltip={label} onClick={() => router.push(targetRoute)}>
                                    {Icon && <Icon className={iconClasses} />}
                                    <span>{label}</span>
                                    <ChevronRight className="invisible ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    {route === '/profile' && <ChevronRight />}
                                    {requiresPremium && <PremiumModule />}
                                </SidebarMenuButton>

                            </SidebarMenuItem>
                        );
                    }

                    // 📂 Si hay subitems, renderizar como Collapsible
                    return (
                        <Collapsible
                            key={route}
                            asChild
                            defaultOpen={isActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton className={linkClasses} tooltip={label}>
                                        {Icon && <Icon className={iconClasses} />}
                                        <span>{label}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        {requiresPremium && <PremiumModule />}
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild>
                                                    <Link
                                                        href={subItem.url}
                                                        onClick={handleClick}
                                                        className='text-sm
                                                        text-muted-foreground
                                                        flex
                                                        items-center
                                                        justify-between
                                                        py-2
                                                        rounded-md
                                                        font-medium
                                                        transition
                                                        text-zinc-600
                                                        dark:text-zinc-300
                                                        hover:bg-zinc-100
                                                        dark:hover:bg-zinc-800'
                                                    // className=" hover:text-foreground "
                                                    >
                                                        {subItem.title}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup >
    );
}
