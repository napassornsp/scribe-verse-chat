import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Plus,
  MessageSquare,
  FileText,
  Eye,
  User,
  PanelLeft,
  PanelLeftOpen,
  HelpCircle,
  Bell,
  Home,
  LogIn,
  LogOut,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import service from "@/services/backend";
import type { Chat } from "@/services/types";

interface AppSidebarProps {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  loggedIn?: boolean;
}

export function AppSidebar({ chats, activeId, onSelect, onNewChat, onRename, onDelete, loggedIn }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const groups = useMemo(() => {
    const now = new Date();
    const getAgeDays = (iso: string) => {
      const d = new Date(iso);
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    };

    const recent: Chat[] = [];
    const last7: Chat[] = [];
    const last30: Chat[] = [];
    const older: Chat[] = [];

    for (const c of chats) {
      const days = getAgeDays(c.created_at);
      if (days <= 1) recent.push(c);
      else if (days <= 7) last7.push(c);
      else if (days <= 30) last30.push(c);
      else older.push(c);
    }

    return { recent, last7, last30, older };
  }, [chats]);

  return (
    <Sidebar collapsible="icon" className="h-screen overflow-hidden z-[3]">
      <SidebarContent className="overflow-hidden">
        <SidebarHeader>
          <div className="flex items-center justify-between px-2 py-2">
            {/* Logo area: expanded shows logo + name; collapsed shows compact logo only */}
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-sm">Company</span>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Expand sidebar" onClick={toggleSidebar}>
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Collapse sidebar" onClick={toggleSidebar}>
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse</TooltipContent>
              </Tooltip>
            )}
          </div>
        </SidebarHeader>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Modules</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "Chatbot", hidden: false }} isActive size="default" className="overflow-hidden">
                  <MessageSquare />
                  {!collapsed && <span>Chatbot</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "OCR", hidden: false }} disabled className="overflow-hidden">
                  <FileText />
                  {!collapsed && <span>OCR</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "Vision AI", hidden: false }} disabled className="overflow-hidden">
                  <Eye />
                  {!collapsed && <span>Vision AI</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* New Chat moved to its own section below */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNewChat}
                  tooltip={{ children: "New Chat", hidden: false }}
                  className="overflow-hidden bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-110"
                >
                  <Plus />
                  {!collapsed && <span className="font-medium">New Chat</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {!collapsed && (
            <SidebarGroup className="min-h-0 flex-1 overflow-hidden">
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="min-h-0 max-h-full overflow-y-auto pr-1">
                {groups.recent.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide">Recently</div>
                    <SidebarMenu>
                      {groups.recent.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            isActive={activeId === chat.id}
                            onClick={() => onSelect(chat.id)}
                            tooltip={{ children: chat.title, hidden: false }}
                            className="overflow-hidden"
                          >
                            <MessageSquare />
                            <span className="truncate">{chat.title}</span>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction aria-label="Chat actions">…</SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50">
                              <DropdownMenuItem onClick={() => {
                                const name = window.prompt("Rename chat", chat.title);
                                if (name) onRename(chat.id, name);
                              }}>Rename</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(chat.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {groups.last7.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide">Last 7 Days</div>
                    <SidebarMenu>
                      {groups.last7.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            isActive={activeId === chat.id}
                            onClick={() => onSelect(chat.id)}
                            tooltip={{ children: chat.title, hidden: false }}
                            className="overflow-hidden"
                          >
                            <MessageSquare />
                            <span className="truncate">{chat.title}</span>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction aria-label="Chat actions">…</SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50">
                              <DropdownMenuItem onClick={() => {
                                const name = window.prompt("Rename chat", chat.title);
                                if (name) onRename(chat.id, name);
                              }}>Rename</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(chat.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {groups.last30.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide">Last 30 Days</div>
                    <SidebarMenu>
                      {groups.last30.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            isActive={activeId === chat.id}
                            onClick={() => onSelect(chat.id)}
                            tooltip={{ children: chat.title, hidden: false }}
                            className="overflow-hidden"
                          >
                            <MessageSquare />
                            <span className="truncate">{chat.title}</span>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction aria-label="Chat actions">…</SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50">
                              <DropdownMenuItem onClick={() => {
                                const name = window.prompt("Rename chat", chat.title);
                                if (name) onRename(chat.id, name);
                              }}>Rename</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(chat.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {groups.older.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide">Older</div>
                    <SidebarMenu>
                      {groups.older.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            isActive={activeId === chat.id}
                            onClick={() => onSelect(chat.id)}
                            tooltip={{ children: chat.title, hidden: false }}
                            className="overflow-hidden"
                          >
                            <MessageSquare />
                            <span className="truncate">{chat.title}</span>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction aria-label="Chat actions">…</SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50">
                              <DropdownMenuItem onClick={() => {
                                const name = window.prompt("Rename chat", chat.title);
                                if (name) onRename(chat.id, name);
                              }}>Rename</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(chat.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarFooter className="mt-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton tooltip={{ children: "Profile", hidden: false }} className={`overflow-hidden ${collapsed ? "w-full justify-center mx-auto" : ""}`}>
                        <div className="relative">
                          <User />
                          {/* Notification dot */}
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" aria-hidden></span>
                        </div>
                        {!collapsed && <span>Profile</span>}
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="p-1 w-56">
                      <div className="flex flex-col">
                        <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted" onClick={() => (window.location.href = "/")}>
                          <Home className="h-4 w-4" /> Home
                        </button>
                        <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted" onClick={() => (window.location.href = "/profile")}>
                          <User className="h-4 w-4" /> User Profile
                        </button>
                        <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted" onClick={() => {}}>
                          <Bell className="h-4 w-4" /> Notifications
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs px-1">3</span>
                        </button>
                        <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted" onClick={() => window.open("https://docs.lovable.dev/", "_blank")}>
                          <HelpCircle className="h-4 w-4" /> Help
                        </button>
                        <div className="my-1 border-t" />
                        {loggedIn ? (
                          <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted" onClick={async () => { try { await service.signOut(); } catch {} finally { window.location.href = "/auth"; } }}>
                            <LogOut className="h-4 w-4" /> Logout
                          </button>
                        ) : (
                          <button className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted" onClick={() => (window.location.href = "/auth")}>
                            <LogIn className="h-4 w-4" /> Login
                          </button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
