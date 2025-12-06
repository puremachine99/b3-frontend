"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { Icon } from "@tabler/icons-react";
import {
  IconInnerShadowTop,
  IconLayoutDashboard,
  IconListDetails,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import logo from "@/public/logo.png";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

/* ================================
   TYPE DEFINITIONS — FIXED
================================ */

type MenuItem = {
  title: string;
  url: string;
  icon: Icon;
  match?: "exact" | "startsWith";
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

/* ================================
   MENU DATA
================================ */

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  menu: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          icon: IconLayoutDashboard,
          url: "/dashboard",
          match: "exact",
        },
      ],
    },
    {
      title: "Devices",
      items: [
        {
          title: "Device List",
          icon: IconListDetails,
          url: "/dashboard/devices",
          match: "exact",
        },
        {
          title: "Group List",
          icon: IconUsersGroup,
          url: "/dashboard/devices/groups",
          match: "startsWith",
        },
      ],
    },
    {
      title: "Users",
      items: [
        {
          title: "User List",
          icon: IconUsers,
          url: "/dashboard/users",
          match: "startsWith",
        },
      ],
    },
  ] satisfies MenuSection[],
};

/* ================================
   SIDEBAR COMPONENT
================================ */

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState(data.user);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser((prev) => ({
          ...prev,
          name: parsed?.username ?? parsed?.name ?? prev.name,
          email: parsed?.email ?? prev.email,
        }));
      }
    } catch (e) {
      console.error("Failed to load user", e);
    }
  }, []);

  const isActive = (item: MenuItem) => {
    const mode = item.match ?? "startsWith";
    if (mode === "exact") return pathname === item.url;
    return pathname.startsWith(item.url);
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="gap-2">
                
                <Image
                  src={logo}
                  alt="B3Sahabat"
                  className="h-8 w-auto"
                  priority
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {data.menu.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
              {(() => {
                const IconComp = section.items[0]?.icon;
                if (!IconComp) return null;
                return <IconComp className="size-4 opacity-50" />;
              })()}
              <span>{section.title}</span>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(item)}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
