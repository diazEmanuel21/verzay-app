'use client';

import * as React from 'react';
import { BotMessageSquare } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Label } from './ui/label';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@prisma/client';

interface TeamSwitcherProps {
    user: User;
    isAssigned: boolean;
}

export function TeamSwitcher({ user, isAssigned }: TeamSwitcherProps) {
    const isAgent = user.role === 'reseller' || isAssigned;

    return (
        <SidebarMenu>
            <SidebarMenuItem className="flex">
                {!isAgent ? (
                    <>
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground mr-2">
                            <Link href="/" aria-label="Volver al inicio">
                                <Image
                                    src="/assets/image/logo_animal.png"
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
                ) : (
                    <>
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground mr-2">
                            <Link href="/" aria-label="Volver al inicio">
                                <BotMessageSquare
                                    className="text-blue-500 w-6 h-6 animate-bounce"
                                    aria-label="Agente activo"
                                />
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
                                    AGENTE IA
                                </Label>
                            </span>
                            {/* <span className="truncate text-xs ">{user?.plan}</span> */}
                        </div>
                    </>
                )}
            </SidebarMenuItem>
        </SidebarMenu>
    );
}