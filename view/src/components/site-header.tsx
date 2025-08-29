import { SidebarIcon, Search, MessageCircle, ChevronDown } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SiteHeader({ onCreateNewNote }: { onCreateNewNote?: () => void }) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b border-border">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        {/* Sidebar Toggle */}
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* Breadcrumb */}
        <Breadcrumb className="flex-1">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Select defaultValue="rafaels-team">
                <SelectTrigger className="border-0 bg-transparent p-0 h-auto gap-2 hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <div className="w-[18px] h-[18px] rounded bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#d0ec1a] rounded-sm" />
                    </div>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rafaels-team">Rafael Valls's team</SelectItem>
                  <SelectItem value="other-team">Other team</SelectItem>
                </SelectContent>
              </Select>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <Select defaultValue="my-project">
                <SelectTrigger className="border-0 bg-transparent p-0 h-auto gap-2 hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>lucis.deco.page</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my-project">My project</SelectItem>
                  <SelectItem value="other-project">Other project</SelectItem>
                </SelectContent>
              </Select>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-normal text-muted-foreground">
                /2025/aug/27/index.json
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {onCreateNewNote && (
            <Button className="bg-[#d0ec1a] text-[#07401a] hover:bg-[#c5e016]" onClick={onCreateNewNote}>
              New Note
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MessageCircle className="h-[18px] w-[18px]" />
          </Button>
          <Button className="bg-[#d0ec1a] text-[#07401a] hover:bg-[#d0ec1a]/90 px-6">
            Deploy
            <div className="ml-2 bg-[#07401a] text-[#d0ec1a] rounded w-4 h-4 flex items-center justify-center text-xs">
              1
            </div>
          </Button>
        </div>
      </div>
    </header>
  )
}
