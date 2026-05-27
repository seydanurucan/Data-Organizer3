import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Copy, Check, Star, ChevronRight, Map, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAddFavorite, useListFavorites, useGetRoadmap, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-black/80 border border-primary/20 rounded-xl p-4 text-primary font-mono text-sm overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors opacity-0 group-hover:opacity-100" data-testid="btn-copy-code">
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function parseExplanation(text: string) {
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)```/g;
  const outputRegex = /\*\*Program .*?:\*\*\s*```([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code" | "output"; content: string }> = [];
  let last = 0;
  let match: RegExpExecArray | null;

  const cleanedText = text.replace(outputRegex, (_, content) => {
    parts.push({ type: "output", content: content.trim() });
    return "";
  });

  const withoutOutput = cleanedText;
  const codeRegex = /```[\w]*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  while ((match = codeRegex.exec(withoutOutput)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: withoutOutput.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < withoutOutput.length) {
    parts.push({ type: "text", content: withoutOutput.slice(lastIndex) });
  }
  return parts;
}

export default function Explain() {
  const params = useParams<{ term: string }>();
  const term = decodeURIComponent(params.term ?? "");
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [explanation, setExplanation] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [deepExplanation, setDeepExplanation] = useState("");
  const [isDeepening, setIsDeepening] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const addFavMutation = useAddFavorite();
  const roadmapMutation = useGetRoadmap();
  const { data: favorites } = useListFavorites({ query: { queryKey: getListFavoritesQueryKey(), enabled: !!token }, request: { headers: { Authorization: `Bearer ${token}` } } });

  useEffect(() => {
    if (favorites) {
      setIsFavorited(favorites.some((f: any) => f.term === term));
    }
  }, [favorites, term]);

  useEffect(() => {
    if (!term) return;
    streamExplanation();
    return () => abortRef.current?.abort();
  }, [term]);

  const BASE = import.meta.env.BASE_URL;

  async function streamExplanation() {
    setExplanation("");
    setIsStreaming(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`${BASE}api/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ term }),
        signal: abortRef.current.signal,
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
          if (parsed.content) setExplanation(prev => prev + parsed.content);
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") toast({ variant: "destructive", title: "Hata", description: "Aciklama yuklenemedi." });
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleDeepen() {
    setShowDeep(true);
    setDeepExplanation("");
    setIsDeepening(true);
    try {
      const res = await fetch(`${BASE}api/explain/deepen`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ term, previousExplanation: explanation }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
          if (parsed.content) setDeepExplanation(prev => prev + parsed.content);
        }
      }
    } finally {
      setIsDeepening(false);
    }
  }

  function handleRoadmap() {
    setShowRoadmap(true);
    roadmapMutation.mutate({ data: { term } }, {
      onSuccess: (data) => setRoadmap(data),
      onError: () => toast({ variant: "destructive", title: "Hata", description: "Yol haritasi yuklenemedi." }),
    });
  }

  function handleFavorite() {
    if (isFavorited) return;
    addFavMutation.mutate({ data: { term, explanation: explanation.slice(0, 500) } }, {
      onSuccess: () => {
        setIsFavorited(true);
        queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        toast({ title: "Favorilere eklendi", description: `"${term}" kaydedildi.` });
      },
    });
  }

  const parts = parseExplanation(explanation);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">DECODING</p>
          <h1 className="text-2xl font-bold text-gradient font-mono">{term}</h1>
        </div>
        <button onClick={handleFavorite} className={`p-2 rounded-lg transition-all active:scale-95 ${isFavorited ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} data-testid="btn-favorite">
          <Star className={`w-6 h-6 ${isFavorited ? "fill-yellow-400" : ""}`} />
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 min-h-[120px] relative">
        {isStreaming && explanation.length === 0 && (
          <div className="flex items-center gap-2 text-primary font-mono text-sm">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Aciklama yukleniyor...
          </div>
        )}
        <div className="space-y-3 text-sm leading-relaxed text-foreground">
          {parts.map((part, i) =>
            part.type === "code" ? (
              <CodeBlock key={i} code={part.content} />
            ) : part.type === "output" ? (
              <div key={i} className="bg-black/60 border border-white/10 rounded-lg p-3 font-mono text-xs text-green-400">
                <p className="text-muted-foreground mb-1">Program Ciktisi:</p>
                <pre>{part.content}</pre>
              </div>
            ) : (
              <p key={i} className="whitespace-pre-wrap">{part.content}</p>
            )
          )}
          {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
        </div>
      </div>

      {!isStreaming && explanation && (
        <div className="flex flex-col gap-3">
          <Button onClick={handleDeepen} variant="outline" className="w-full border-secondary/50 text-secondary hover:bg-secondary/10 font-mono glow-border-blue active:scale-95 transition-transform" data-testid="btn-deepen">
            <Zap className="w-4 h-4 mr-2" /> Daha Derinlemesine Anlat
          </Button>
          <Button onClick={handleRoadmap} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 font-mono active:scale-95 transition-transform" data-testid="btn-roadmap">
            <Map className="w-4 h-4 mr-2" /> Siradaki Adim Ne?
          </Button>
          <Button onClick={() => setLocation(`/quiz/${encodeURIComponent(term)}`)} className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-black font-mono active:scale-95 transition-transform" data-testid="btn-quiz">
            <BookOpen className="w-4 h-4 mr-2" /> Kendini Test Et
          </Button>
        </div>
      )}

      {showDeep && (
        <div className="glass-card rounded-xl p-4 border-l-2 border-l-secondary">
          <p className="text-xs font-mono text-secondary mb-3">DERINLEMESINE ACIKLAMA</p>
          {isDeepening && deepExplanation.length === 0 && (
            <div className="flex items-center gap-2 text-secondary font-mono text-sm">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              Yukleniyor...
            </div>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{deepExplanation}</div>
          {isDeepening && <span className="inline-block w-2 h-4 bg-secondary animate-pulse ml-1" />}
        </div>
      )}

      {showRoadmap && (
        <div className="glass-card rounded-xl p-4 border-l-2 border-l-primary">
          <p className="text-xs font-mono text-primary mb-4">YOL HARITASI</p>
          {roadmapMutation.isPending && <div className="text-sm text-muted-foreground font-mono">Olusturuluyor...</div>}
          {roadmap?.steps?.map((step: any) => (
            <div key={step.order} className="flex gap-3 mb-4 last:mb-0">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-mono text-primary">{step.order}</div>
              <div>
                <p className="font-semibold text-white text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
