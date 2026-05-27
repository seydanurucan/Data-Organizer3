import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Send, Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListOpenaiMessages,
  getListOpenaiConversationsQueryKey,
  getListOpenaiMessagesQueryKey,
  getGetOpenaiConversationQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function Chat() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const convId = params.id ? parseInt(params.id) : null;
  const [input, setInput] = useState("");
  const [streamingMsg, setStreamingMsg] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const BASE = import.meta.env.BASE_URL;

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: conversations } = useListOpenaiConversations({
    query: { queryKey: getListOpenaiConversationsQueryKey() },
  });

  const { data: messages } = useListOpenaiMessages(
    convId!,
    { query: { queryKey: getListOpenaiMessagesQueryKey(convId!), enabled: !!convId } }
  );

  const createConvMutation = useCreateOpenaiConversation();
  const deleteConvMutation = useDeleteOpenaiConversation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMsg]);

  const createConversation = () => {
    createConvMutation.mutate({ data: { title: "Yeni Sohbet" } }, {
      onSuccess: (conv) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setLocation(`/chat/${conv.id}`);
      },
    });
  };

  const deleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConvMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (convId === id) setLocation("/chat");
      },
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || !convId || isStreaming) return;
    const content = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingMsg("");

    queryClient.setQueryData(getListOpenaiMessagesQueryKey(convId), (old: any[] = []) => [
      ...old,
      { id: Date.now(), conversationId: convId, role: "user", content, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(`${BASE}api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } as HeadersInit,
        body: JSON.stringify({ content }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const parsed = JSON.parse(line.slice(6));
          if (parsed.done) break;
          if (parsed.content) { full += parsed.content; setStreamingMsg(full); }
        }
      }
      setStreamingMsg("");
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(convId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    } finally {
      setIsStreaming(false);
    }
  };

  const allMessages = messages ?? [];

  return (
    <div className="flex h-[calc(100dvh-120px)] gap-0 -mx-4 -mt-4">
      <aside className="w-16 flex flex-col gap-2 p-2 border-r border-white/10 bg-black/30 overflow-y-auto">
        <button onClick={createConversation} className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 flex items-center justify-center transition-colors active:scale-95 mx-auto flex-shrink-0" data-testid="btn-new-chat">
          <Plus className="w-4 h-4" />
        </button>
        {conversations?.map((conv: any) => (
          <div key={conv.id} className="relative group">
            <button
              onClick={() => setLocation(`/chat/${conv.id}`)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors active:scale-95 mx-auto ${convId === conv.id ? "bg-primary/30 border border-primary/50 text-primary" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}
              data-testid={`btn-conv-${conv.id}`}
              title={conv.title}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={(e) => deleteConversation(conv.id, e)} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full items-center justify-center hidden group-hover:flex" data-testid={`btn-del-conv-${conv.id}`}>
              <Trash2 className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {!convId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-mono text-sm text-center">Yeni bir sohbet baslatmak icin + tusuna basin</p>
            <Button onClick={createConversation} className="bg-primary/20 text-primary hover:bg-primary hover:text-black font-mono active:scale-95" data-testid="btn-start-chat">
              <Plus className="w-4 h-4 mr-2" /> Yeni Sohbet
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {allMessages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`msg-${msg.role}-${msg.id}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm font-sans leading-relaxed ${msg.role === "user" ? "bg-primary/20 text-primary border border-primary/30" : "glass-card text-foreground border-white/10"}`}>
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  </div>
                </div>
              ))}
              {isStreaming && streamingMsg && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] glass-card rounded-xl px-4 py-3 text-sm border-white/10">
                    <pre className="whitespace-pre-wrap font-sans">{streamingMsg}<span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" /></pre>
                  </div>
                </div>
              )}
              {isStreaming && !streamingMsg && (
                <div className="flex justify-start">
                  <div className="glass-card rounded-xl px-4 py-3 border-white/10 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/10 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Bir sey sor..."
                className="bg-black/50 border-white/10 focus-visible:ring-primary text-primary font-mono text-sm"
                disabled={isStreaming}
                data-testid="input-chat"
              />
              <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} className="bg-primary/20 text-primary hover:bg-primary hover:text-black active:scale-95 flex-shrink-0" data-testid="btn-send-message">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
