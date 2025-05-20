"use client"

import { User } from "@prisma/client"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import ThemeSwitcher from "./custom/ThemeSwitcher"
import LogoutButton from "./logout-button"
import { ResellerInfoResponse } from "@/schema/reseller"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {

    return (
        <Sidebar collapsible="icon" {...props} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-zinc-100 border-r border-zinc-200 dark:border-gray-800">
            <SidebarHeader>
                <TeamSwitcher user={user} />
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
                <LogoutButton user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
