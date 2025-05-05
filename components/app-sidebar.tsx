"use client"

import { useEffect, useState } from "react"
import { User } from "@prisma/client"

import {
    BookOpen,
    Bot,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
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

// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "Verzay",
            logo: GalleryVerticalEnd,
            plan: "Pymes",
        },
    ],
    navMain: [
        {
            title: "Playground",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "History",
                    url: "#",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const [isAssigned, setUserAssignedToReseller] = useState(false);

    useEffect(() => {
        onIsUserAssignedToReseller();
    }, []);

    const onIsUserAssignedToReseller = async () => {
        const isAssigned = await isUserAssignedToReseller(user.id)
        setUserAssignedToReseller(isAssigned);
    };

    return (
        <Sidebar collapsible="icon" {...props} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-zinc-100 border-r border-zinc-200 dark:border-gray-800">
            <SidebarHeader>
                <TeamSwitcher user={user} isAssigned={isAssigned} />
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
