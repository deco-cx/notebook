import * as React from "react"
import {
  PencilLine,
  NotebookText,
  Workflow,
  LayoutGrid,
  SquarePlus,
  User,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Daily note",
    url: "/daily-note",
    icon: PencilLine,
  },
  {
    title: "Notes", 
    url: "/notes",
    icon: NotebookText,
  },
  {
    title: "Workflows",
    url: "/workflows", 
    icon: Workflow,
  },
  {
    title: "Apps",
    url: "/apps",
    icon: LayoutGrid,
  },
]

const user = {
  name: "Lucis",
  email: "lucis@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! border-r border-border"
      {...props}
    >
      <SidebarContent className="flex flex-col">
        {/* Main Navigation */}
        <div className="flex-1 px-2 py-3">
          <SidebarMenu className="space-y-0">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a
                    href={item.url}
                    className="flex items-center gap-3 px-4 h-10 text-sm font-normal text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            {/* Add view button */}
            <SidebarMenuItem>
              <div className="px-0 py-2">
                <SidebarMenuButton asChild>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 h-10 text-sm font-normal text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border border-dashed border-border bg-muted/20 transition-colors"
                  >
                    <SquarePlus className="h-5 w-5 opacity-30" />
                    Add view
                  </a>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        
        {/* Bottom section with plan info and user */}
        <div className="px-2 py-0">
          {/* Plan info */}
          <div className="mb-0 px-4 py-3 rounded-xl bg-secondary">
            <div className="text-xs text-muted-foreground mb-1 leading-5">FREE PLAN</div>
            <div className="flex justify-between items-center text-sm leading-5">
              <span className="text-foreground">Team Balance</span>
              <span className="text-muted-foreground">$900</span>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-normal text-foreground leading-5">{user.name}</span>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
