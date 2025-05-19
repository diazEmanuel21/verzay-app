"use client"

import { useEffect, useState } from "react"
import { User } from "@prisma/client"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { isUserAssignedToReseller } from "@/actions/reseller-action"
import ThemeSwitcher from "./custom/ThemeSwitcher"
import LogoutButton from "./logout-button"
import { BrandSelector } from "./custom"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const [resellerInformation, setResellerInformation] = useState<User | null>(null)

    useEffect(() => {
        const fetchReseller = async () => {
            const response = await isUserAssignedToReseller(user.id)

            if (response.success && response.data) {
                setResellerInformation(response.data)
            } else {
                setResellerInformation(null)
            }
        }

        fetchReseller()
    }, [user.id])

    return (
        <Sidebar collapsible="icon" {...props} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-zinc-100 border-r border-zinc-200 dark:border-gray-800">
            <SidebarHeader>
                {
                    resellerInformation &&
                    <TeamSwitcher user={user} resellerInformation={resellerInformation} />
                }
            </SidebarHeader>
            <SidebarContent>
                <NavMain user={user} />
            </SidebarContent>
            <SidebarFooter>
                {/* <SidebarGroupLabel>IA Créditos</SidebarGroupLabel> */}
                <div className="flex flex-row w-full justify-center items-center">
                    <NavProjects user={user} />
                    <div>
                        <ThemeSwitcher />
                    </div>
                </div>
                <BrandSelector />
                <LogoutButton user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
