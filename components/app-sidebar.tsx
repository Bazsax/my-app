"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  House,
  Landmark,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Wallet,
} from "lucide-react"

import { NavSecondary } from "@/components/nav-secondary"
import { NavMenu } from "@/components/nav-menu"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMenu: [
    {
      name: "Áttekintés",
      url: "#",
      icon: House,
    },
    {
      name: "Költségvetés",
      url: "/koltseg",
      icon: Wallet,
    },
    {
      name: "Statisztika",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Számlák",
      url: "#",
      icon: Landmark,
    },

  ],
  navSecondary: [
    {
      title: "Költségek",
      url: "#",
      isActive: true,
      items: [
        {
          title: "Előzmények",
          url: "#",
        },
        {
          title: "Kedvencek",
          url: "#",
        },
        {
          title: "Beállítások",
          url: "#",
        },
      ],
    },
    {
      title: "Modellek",
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
      title: "Dokumentáció",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Bevezetés",
          url: "#",
        },
        {
          title: "Kezdés",
          url: "#",
        },
        {
          title: "Oktatóanyagok",
          url: "#",
        },
        {
          title: "Változások",
          url: "#",
        },
      ],
    },
    {
      title: "Beállítások",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Általános",
          url: "#",
        },
        {
          title: "Csapat",
          url: "#",
        },
        {
          title: "Számlázás",
          url: "#",
        },
        {
          title: "Korlátok",
          url: "#",
        },
      ],
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMenu navMenu={data.navMenu} />
        <NavSecondary items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <TeamSwitcher teams={data.teams} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
