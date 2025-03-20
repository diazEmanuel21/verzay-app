"use client";

import { navLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import LogoutButton from "./logout-button";
import { ModeToggle } from "./theme-toggle-button";
import { User } from "@prisma/client";


type userInterfaceProps = {
  userInformation: User;
};

export const AppSidebar = ({ userInformation }: userInterfaceProps) => {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      {/* Sidebar Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/" className="sidebar-logo flex items-center">
                <Image
                  src="/assets/image/Logo2.png"
                  alt="logo"
                  width={180}
                  height={28}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarMenu className="sidebar-nav_elements">
          {navLinks.map((link, index) => {
            const isActive = link.route === pathname;

            return (
              <SidebarMenuItem key={link.route}>
                <SidebarMenuButton
                  asChild
                  className={`sidebar-nav_element group ${isActive
                    ? "bg-purple-50 shadow-inner text-gray-900"
                    : "text-gray-700"
                    }`}
                >
                  <Link className="sidebar-link flex items-center gap-2" href={link.route}>
                    <Image
                      src={link.icon}
                      alt="logo"
                      width={24}
                      height={24}
                      className={`${isActive && "brightness-200"}`}
                    />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LogoutButton userInformation={userInformation} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ModeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
