'use client';

import * as React from 'react';
import { BotMessageSquare } from 'lucide-react';
import { useResellerStore } from '@/stores/resellers/resellerStore';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Label } from './ui/label';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@prisma/client';
import { Avatar, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

interface TeamSwitcherProps {
    user: User;
}

export function TeamSwitcher({ user }: TeamSwitcherProps) {
    const { reseller, isLoaded } = useResellerStore();

    if (!isLoaded) {
        return (
            <SidebarMenu>
                <SidebarMenuItem className="flex gap-3 items-center">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }
    const resellerInfo = reseller;
    return (
        <SidebarMenu>
            <SidebarMenuItem className="flex">
                {resellerInfo ? (
                    <>
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground mr-2">
                            <Link href="/" aria-label="Volver al inicio">
                                {!resellerInfo.image
                                    ? <BotMessageSquare
                                        className="text-blue-500 w-6 h-6 animate-bounce"
                                        aria-label="Agente activo"
                                    />
                                    :
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={resellerInfo?.image} alt={resellerInfo?.name ?? ''} />
                                    </Avatar>
                                }
                            </Link>
                        </div>

                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                <Label
                                    className={clsx(
                                        'text-2xl font-extrabold tracking-wide uppercase font-mono',
                                        'text-blue-600 drop-shadow-sm'
                                    )}
                                >
                                    {/* AGENTE IA */}
                                    {resellerInfo.company}
                                </Label>
                            </span>
                            {/* <span className="truncate text-xs ">{user?.plan}</span> */}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg mr-2">
                            <Link href="/" aria-label="Volver al inicio">
                                <Image
                                    src="/assets/image/logo_app.png"
                                    alt="Logo Verzay"
                                    width={140}
                                    height={28}
                                    className="cursor-pointer"
                                    priority
                                />
                            </Link>
                        </div>
                        <div className="grid flex-1 text-left text-lg leading-tight">
                            <span className="truncate font-semibold text-2xl">
                                {/* {user.company} */}
                                Verzay
                            </span>
                            {/* <span className="truncate text-xs">{user?.plan}</span> */}
                        </div>
                    </>
                )}
            </SidebarMenuItem>
        </SidebarMenu>
    );
}