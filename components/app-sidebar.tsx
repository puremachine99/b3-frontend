"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { Icon } from "@tabler/icons-react";
import {
  IconDevices,
  IconInnerShadowTop,
  IconLayoutDashboard,
  IconLivePhoto,
  IconListDetails,
  IconServer,
  IconTopologyStar,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

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

type MenuItem = {
  title: string;
  url: string;
  icon: Icon;
  match?: "exact" | "startsWith";
};

type MenuSection = {
  title: string;
  icon: Icon;
  url?: string;
  items?: MenuItem[];
};

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "", // fallback to initials if not provided
  },
  menu: [
    {
      title: "Dashboard",
      icon: IconLayoutDashboard,
      url: "/dashboard",
      match: "exact",
    },
    {
      title: "Devices",
      icon: IconDevices,
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
      icon: IconUsers,
      items: [
        {
          title: "User List",
          icon: IconListDetails,
          url: "/dashboard/users",
          match: "startsWith",
        },
      ],
    },
  ] satisfies MenuSection[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState(data.user);

  React.useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser((prev) => ({
          ...prev,
          name: parsed?.username || parsed?.name || prev.name,
          email: parsed?.email || prev.email,
        }));
      }
    } catch (error) {
      console.error("Failed to load user from storage", error);
    }
  }, []);

  const isActive = (item: MenuItem | MenuSection) => {
    const mode = item.match ?? "startsWith";
    if (mode === "exact") {
      return pathname === item.url;
    }
    return pathname.startsWith(item.url ?? "");
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
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Nono IoT</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.menu.map((section) =>
          section.items ? (
            // SECTION / GROUP
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                <section.icon className="size-4" />
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
          ) : (
            // SINGLE ITEM (DASHBOARD)
            <SidebarMenuItem key={section.title}>
              <SidebarMenuButton
                asChild
                tooltip={section.title}
                isActive={isActive(section)}
              >
                <a href={section.url}>
                  <section.icon />
                  <span>{section.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
