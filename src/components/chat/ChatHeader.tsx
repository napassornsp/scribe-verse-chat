import { useEffect, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { BotVersion, Credits } from "@/services/types";

interface ChatHeaderProps {
  version: BotVersion;
  credits: Credits | null;
  onVersionChange: (v: BotVersion) => void;
}

export function ChatHeader({ version, credits, onVersionChange }: ChatHeaderProps) {
  const remaining = useMemo(() => {
    if (!credits) return 0;
    return version === "V1" ? credits.v1 : version === "V2" ? credits.v2 : credits.v3;
  }, [credits, version]);

  return (
    <header className="h-14 border-b flex items-center px-3 gap-3">
      <SidebarTrigger className="ml-1" />
      <h1 className="text-base font-medium">ChatBot Version</h1>
      <Select value={version} onValueChange={(v) => onVersionChange(v as BotVersion)}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="V1">V1</SelectItem>
          <SelectItem value="V2">V2</SelectItem>
          <SelectItem value="V3">V3</SelectItem>
        </SelectContent>
      </Select>
      <Badge variant="secondary" aria-live="polite">Credits: {remaining}</Badge>
      <div className="ml-auto text-sm text-muted-foreground">Switch versions anytime</div>
    </header>
  );
}
