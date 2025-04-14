"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { navLinks } from "@/constants/navLinks";
import { canAccessRoute, getRouteAccess } from "@/utils/access";
import { toast } from "sonner";
import { PremiumModule } from "./PremiumModule";

import { Badge } from "@/components/ui/badge"
import {
    Card,
} from "@/components/ui/card"

interface BubbleMenuProps {
    user: User
}

export function BubbleMenu({ user }: BubbleMenuProps) {
    if (!user) return;

    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="flex flex-wrap gap-2">
            {navLinks
                .filter(link => link.showInSidebar)
                .filter(link => {
                    const access = getRouteAccess(link.route);
                    // Mostrar solo si no es adminOnly o el usuario es admin
                    return !access?.adminOnly || user.role === 'admin';
                })
                .map((link) => {
                    const { route, icon: Icon, label, requiresPremium } = link;

                    const isActive =
                        pathname === route || (route !== '/' && pathname.startsWith(route));

                    const handleClick = (e: React.MouseEvent) => {
                        const access = getRouteAccess(route);
                        const canIget = canAccessRoute({
                            route,
                            userRole: user.role,
                            userPlan: user.plan,
                        });
                        // Validación de acceso por plan/admin (pero solo redirige, no oculta)
                        if (
                            access &&
                            !canIget.allowed
                        ) {
                            e.preventDefault();
                            toast.info("Acceso limitado. Actualiza tu plan para desbloquear esta función premium.");
                            router.push('/credits');
                        }
                    };

                    return (
                        <div className="flex flex-col justify-center items-center gap-2">
                            <Card className=" relative flex flex-col justify-center items-center p-4">
                                {requiresPremium &&
                                    <div className="absolute top-0 right-0"><PremiumModule /></div>
                                }
                                <Link
                                    key={route}
                                    href={route}
                                    onClick={handleClick}
                                >
                                    <Icon
                                        className="h-5"
                                    />
                                </Link>
                            </Card>
                            <Badge>{label}</Badge>
                        </div>
                    );
                })}
        </div>
    );
}
