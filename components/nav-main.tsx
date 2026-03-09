'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { canAccessRoute } from '@/utils/access';
import { PremiumModule } from './shared/PremiumModule';

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import Link from 'next/link';
import { User } from '@prisma/client';
import clsx from 'clsx';
import { iconMap } from '@/schema/module';
import { useModuleStore } from '@/stores/modules/useModuleStore';

export function NavMain({ user }: { user: User }) {
    const { modules, setLabelModule, labelModule } = useModuleStore();
    const pathname = usePathname();
    const router = useRouter();

    /* Se ocupa de ocultar/mostrar basado en los permisos del modulo */
    const navItems = modules
        .filter(link => link.showInSidebar)
        .filter(link => {
            const access = canAccessRoute({
                route: link.route,
                userRole: user.role,
                userPlan: user.plan,
                modules,
                label: link.label,
            });

            // Control de acceso por rol
            if (!access.allowed) {
                return false;
            }

            return true;
        })
        .map(link => {
            let isActive = false;

            if (pathname === '/canva') {
                isActive = labelModule === link.label
            } else {
                isActive = pathname === link.route;
            }

            return { ...link, isActive };
        });

    const handleRoute = (label: string, targetRoute: string) => {
        setLabelModule(label)
        router.push(targetRoute)
    }

    return (
        <SidebarGroup>
            {/* <SidebarGroupLabel>Módulos</SidebarGroupLabel> */}
            <SidebarMenu>
                {navItems.map((item) => {
                    const { route, icon, label, requiresPremium, isActive, moduleItems } = item;
                    const Icon = iconMap[icon as keyof typeof iconMap];
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

                    const validateRouteAndRole = user.role === 'reseller' && route === '/admin';
                    const targetRoute = validateRouteAndRole ? '/admin/clientes' : route;

                    // Si NO hay subitems, renderizar directamente como link
                    if (!moduleItems || moduleItems.length === 0 || validateRouteAndRole) {
                        return (
                            <SidebarMenuItem key={route}>
                                <SidebarMenuButton className={linkClasses} tooltip={label} onClick={() => handleRoute(label, targetRoute)}>
                                    {Icon && <Icon className={iconClasses} />}
                                    <span>{label}</span>
                                    <ChevronRight className="invisible ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    {route === '/profile' && <ChevronRight />}
                                    {requiresPremium && <PremiumModule />}
                                </SidebarMenuButton>

                            </SidebarMenuItem>
                        );
                    }

                    // Si hay subitems, renderizar como Collapsible
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
                                        {moduleItems.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild>
                                                    <Link
                                                        href={subItem.url}
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
