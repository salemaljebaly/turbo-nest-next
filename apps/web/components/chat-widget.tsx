"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Send, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState<string | null>(
    null,
  );
  const statusQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: dashboardApi.aiStatus,
    staleTime: 60_000,
  });
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_URL}/v1/ai/chat`,
        credentials: "include",
        body: conversationId ? { conversationId } : {},
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const nextConversationId = response.headers.get("x-conversation-id");
          if (nextConversationId) setConversationId(nextConversationId);
          return response;
        },
      }),
    [conversationId],
  );
  const { messages, sendMessage, status } = useChat({
    transport,
  });

  if (statusQuery.isLoading || statusQuery.data?.enabled !== true) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-40">
      {open ? (
        <section className="mb-3 flex h-[28rem] w-[22rem] flex-col border bg-card shadow-xl">
          <header className="flex h-11 items-center justify-between border-b px-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="size-4" />
              Assistant
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Ask about your project records or how this template is wired.
              </p>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[90%] border px-2 py-1.5 text-xs",
                  message.role === "user"
                    ? "ms-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <p key={index} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  ) : null,
                )}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = input.trim();
              if (!trimmed) return;
              sendMessage({ text: trimmed });
              setInput("");
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the assistant"
              className="h-8 min-w-0 flex-1 border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={status === "streaming"}
              aria-label="Send message"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </section>
      ) : null}
      <Button size="icon-lg" onClick={() => setOpen((value) => !value)}>
        <Bot className="size-4" />
      </Button>
    </div>
  );
}
