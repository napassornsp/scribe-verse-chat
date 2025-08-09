import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";

interface Props {
  disabled?: boolean;
  onSend: (text: string) => void;
}

export default function ChatInput({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");
  const [filesCount, setFilesCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-expand textarea up to a max height, then scroll internally
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 240; // px
    el.style.height = Math.min(el.scrollHeight, max) + "px";
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSend(value.trim());
          setValue("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, value, onSend]);

  return (
    <div className="border-t p-3 flex gap-2 items-end bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Attach files"
        onClick={() => fileInputRef.current?.click()}
        className="shrink-0"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          const count = e.currentTarget.files?.length ?? 0;
          setFilesCount(count);
          // reset value to allow re-selecting the same file(s)
          e.currentTarget.value = "";
        }}
        className="hidden"
        aria-hidden="true"
      />
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your message..."
        className="min-h-[60px] max-h-60 resize-none overflow-y-auto"
        aria-label="Message input"
        disabled={disabled}
      />
      <Button
        onClick={() => {
          if (!disabled && value.trim()) {
            onSend(value.trim());
            setValue("");
          }
        }}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
      {filesCount > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">{filesCount} file(s) attached</span>
      )}
    </div>
  );
}
