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
import { TooltipProvider } from "@/components/ui/tooltip";
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

    for (const c of chats) {
      const days = getAgeDays(c.created_at);
      if (days <= 1) recent.push(c);
      else if (days <= 7) last7.push(c);
      else if (days <= 30) last30.push(c);
    }

    return { recent, last7, last30 };
  }, [chats]);

  return (
    <Sidebar collapsible="icon" className="h-screen overflow-hidden z-[3]">
      <SidebarContent>
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
              <Button variant="ghost" size="icon" aria-label="Expand sidebar" onClick={toggleSidebar}>
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Collapse sidebar" onClick={toggleSidebar}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Modules</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Chatbot" isActive size="default" className="overflow-hidden">
                  <MessageSquare />
                  {!collapsed && <span>Chatbot</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="OCR" disabled className="overflow-hidden">
                  <FileText />
                  {!collapsed && <span>OCR</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Vision AI" disabled className="overflow-hidden">
                  <Eye />
                  {!collapsed && <span>Vision AI</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* New Chat placed below Vision AI and visually outstanding */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNewChat}
                  tooltip="New Chat"
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
                            tooltip={chat.title}
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
                            tooltip={chat.title}
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
                            tooltip={chat.title}
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

        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {loggedIn ? (
                    <SidebarMenuButton
                      onClick={async () => {
                        try { await service.signOut(); } catch {} finally { window.location.href = "/auth"; }
                      }}
                      tooltip="Logout"
                      className="overflow-hidden"
                    >
                      <LogOut />
                      {!collapsed && <span>Logout</span>}
                    </SidebarMenuButton>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton tooltip="Profile" className="overflow-hidden">
                          <User />
                          {!collapsed && <span>Profile</span>}
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        <DropdownMenuItem onClick={() => (window.location.href = "/")}> <Home className="mr-2 h-4 w-4" /> Home</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { /* placeholder */ }}> <Bell className="mr-2 h-4 w-4" /> Notifications</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => (window.location.href = "/")}> <User className="mr-2 h-4 w-4" /> User Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open("https://docs.lovable.dev/", "_blank")}> <HelpCircle className="mr-2 h-4 w-4" /> Help</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => (window.location.href = "/auth")}> <LogIn className="mr-2 h-4 w-4" /> Login</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
