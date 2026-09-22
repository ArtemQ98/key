import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button, Spinner, Textarea } from "@/components/ui";
import {
  useThread,
  useSendMessage,
  useMarkThreadRead,
} from "@/hooks/useMessages";
import { useAuthStore } from "@/stores/auth";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { MessageBubble } from "./MessageBubble";
import { SystemEvent } from "./SystemEvent";

interface ChatPanelProps {
  rentalId: number;
  otherName: string;
  as: "owner" | "customer";
}

export function ChatPanel({ rentalId, otherName, as }: ChatPanelProps) {
  const owner = useAuthStore((s) => s.user);
  const customer = useCustomerAuthStore((s) => s.customer);
  const myId = as === "owner" ? owner?.id : customer?.id;

  const { data, isLoading } = useThread(rentalId, as);
  const sendMessage = useSendMessage(rentalId, as);
  const markRead = useMarkThreadRead(rentalId, as);

  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && data.unread_count > 0) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.unread_count]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [data?.items.length]);

  const handleSend = () => {
    const text = body.trim();
    if (!text || sendMessage.isPending) return;
    sendMessage.mutate(text, {
      onSuccess: () => setBody(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[600px] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-1 py-2"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Сообщений пока нет
          </div>
        ) : (
          data.items.map((item) =>
            item.kind === "message" ? (
              <MessageBubble
                key={`m-${item.id}`}
                item={item}
                isOwn={item.sender_id === myId}
                senderName={otherName}
              />
            ) : (
              <SystemEvent key={`e-${item.id}`} item={item} />
            ),
          )
        )}
      </div>

      <div className="mt-2 border-t border-border pt-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение…"
            rows={2}
            maxLength={4000}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!body.trim() || sendMessage.isPending}
            size="icon"
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1 text-right text-[10px] text-muted-foreground">
          Enter — отправить, Shift+Enter — новая строка
        </div>
      </div>
    </div>
  );
}