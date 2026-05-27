import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Send, Plus, Trash2, MessageSquare, Bot } from "lucide-react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListOpenaiMessages,
  getListOpenaiConversationsQueryKey,
  getListOpenaiMessagesQueryKey,
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
    <div className="flex -mx-4 -mt-5" style={{ height: 'calc(100dvh - 76px)' }}>

      {/* Sidebar */}
      <aside className="w-14 flex flex-col gap-2 py-3 px-1.5 flex-shrink-0 overflow-y-auto"
        style={{ borderRight: '1px solid rgba(0,255,65,0.07)', background: 'rgba(3,7,4,0.6)' }}>
        <button
          onClick={createConversation}
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto btn-press flex-shrink-0"
          style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.25)', color: '#00ff41' }}
          title="Yeni Sohbet"
          data-testid="btn-new-chat"
        >
          <Plus className="w-4 h-4" />
        </button>
        {conversations?.map((conv: any) => (
          <div key={conv.id} className="relative group/conv">
            <button
              onClick={() => setLocation(`/chat/${conv.id}`)}
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto btn-press"
              style={{
                background: convId === conv.id ? 'rgba(0,255,65,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${convId === conv.id ? 'rgba(0,255,65,0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: convId === conv.id ? '#00ff41' : 'rgba(160,190,168,0.4)',
              }}
              title={conv.title}
              data-testid={`btn-conv-${conv.id}`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => deleteConversation(conv.id, e)}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center hidden group-hover/conv:flex btn-press"
              style={{ background: 'rgba(200,40,40,0.9)' }}
              data-testid={`btn-del-conv-${conv.id}`}
            >
              <Trash2 className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {!convId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,160,220,0.08)', border: '1px solid rgba(0,160,220,0.2)' }}>
              <Bot className="w-7 h-7" style={{ color: 'rgba(0,160,220,0.7)' }} />
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-sm mb-1" style={{ color: 'rgba(200,230,240,0.8)' }}>CodeBuddy ile Sohbet</p>
              <p className="text-xs font-mono" style={{ color: 'rgba(120,160,180,0.45)' }}>Kod hataları, kavramlar, proje fikirleri — her şeyi sor.</p>
            </div>
            <button
              onClick={createConversation}
              className="px-5 py-3 rounded-xl font-mono font-bold text-sm btn-press flex items-center gap-2"
              style={{ background: 'rgba(0,160,220,0.12)', border: '1px solid rgba(0,160,220,0.25)', color: 'rgba(0,190,255,0.9)' }}
              data-testid="btn-start-chat"
            >
              <Plus className="w-4 h-4" /> Yeni Sohbet Başlat
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
              {allMessages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`msg-${msg.role}-${msg.id}`}>
                  <div
                    className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={msg.role === "user"
                      ? { background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.2)', color: 'rgba(180,240,200,0.9)' }
                      : { background: 'rgba(8,14,10,0.85)', border: '1px solid rgba(0,255,65,0.07)', color: 'rgba(200,225,210,0.85)', backdropFilter: 'blur(12px)' }
                    }
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                  </div>
                </div>
              ))}

              {isStreaming && streamingMsg && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm"
                    style={{ background: 'rgba(8,14,10,0.85)', border: '1px solid rgba(0,255,65,0.07)', color: 'rgba(200,225,210,0.85)', backdropFilter: 'blur(12px)' }}>
                    <pre className="whitespace-pre-wrap font-sans">{streamingMsg}<span className="cursor-blink" /></pre>
                  </div>
                </div>
              )}

              {isStreaming && !streamingMsg && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 flex gap-1.5 items-center"
                    style={{ background: 'rgba(8,14,10,0.85)', border: '1px solid rgba(0,255,65,0.07)' }}>
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: 'rgba(0,255,65,0.6)', animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(0,255,65,0.07)' }}>
              <div className="flex gap-2 items-center rounded-2xl px-4 py-2"
                style={{ background: 'rgba(4,10,6,0.9)', border: '1px solid rgba(0,255,65,0.12)' }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Bir şey sor..."
                  className="flex-1 bg-transparent outline-none text-sm font-mono py-1.5 placeholder:opacity-25"
                  style={{ color: 'rgba(210,235,218,0.9)' }}
                  disabled={isStreaming}
                  data-testid="input-chat"
                />
                <button
                  onClick={sendMessage}
                  disabled={isStreaming || !input.trim()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center btn-press flex-shrink-0 disabled:opacity-30 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #00e838, #00cc2e)', color: '#020902' }}
                  data-testid="btn-send-message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
