import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Copy, Check, Star, Map, Zap, BookOpen, ChevronLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAddFavorite,
  useRemoveFavorite,
  useListFavorites,
  useGetRoadmap,
  getListFavoritesQueryKey,
} from "@workspace/api-client-react";
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
    <div className="relative group my-3">
      <pre
        className="rounded-xl p-4 text-sm font-mono overflow-x-auto leading-relaxed"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(0,255,65,0.15)',
          color: '#a8ffb8',
        }}
      >
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg btn-press opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.2)', color: 'rgba(0,255,65,0.7)' }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function renderText(text: string) {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <p key={key++} className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: 'rgba(210,230,215,0.85)' }}>
          {text.slice(last, match.index)}
        </p>
      );
    }
    parts.push(<CodeBlock key={key++} code={match[1].trim()} />);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(
      <p key={key++} className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: 'rgba(210,230,215,0.85)' }}>
        {text.slice(last)}
      </p>
    );
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
  const BASE = import.meta.env.BASE_URL;

  const [explanation, setExplanation] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [deepText, setDeepText] = useState("");
  const [isDeepening, setIsDeepening] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addFavMutation = useAddFavorite();
  const removeFavMutation = useRemoveFavorite();
  const roadmapMutation = useGetRoadmap();

  const { data: favorites } = useListFavorites({
    query: { queryKey: getListFavoritesQueryKey(), enabled: !!token },
    request: { headers: { Authorization: `Bearer ${token}` } },
  });

  useEffect(() => {
    if (favorites) {
      const found = favorites.find((f: any) => f.term === term);
      setIsFavorited(!!found);
      setFavoriteId(found ? found.id : null);
    }
  }, [favorites, term]);

  useEffect(() => {
    if (!term) return;
    streamExplanation();
    return () => abortRef.current?.abort();
  }, [term]);

  async function streamExplanation() {
    setExplanation("");
    setIsStreaming(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`${BASE}api/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } as HeadersInit,
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
      if (e.name !== "AbortError") toast({ variant: "destructive", title: "Hata", description: "Açıklama yüklenemedi." });
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleDeepen() {
    setShowDeep(true);
    setDeepText("");
    setIsDeepening(true);
    try {
      const res = await fetch(`${BASE}api/explain/deepen`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } as HeadersInit,
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
          if (parsed.content) setDeepText(prev => prev + parsed.content);
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
      onError: () => toast({ variant: "destructive", title: "Hata", description: "Yol haritası yüklenemedi." }),
    });
  }

  function handleFavorite() {
    if (isFavorited && favoriteId !== null) {
      // Remove from favorites
      removeFavMutation.mutate({ id: favoriteId }, {
        onSuccess: () => {
          setIsFavorited(false);
          setFavoriteId(null);
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Favorilerden kaldırıldı", description: `"${term}" silindi.` });
        },
      });
    } else {
      // Add to favorites
      addFavMutation.mutate({ data: { term, explanation: explanation.slice(0, 500) } }, {
        onSuccess: (data: any) => {
          setIsFavorited(true);
          setFavoriteId(data?.id ?? null);
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Favorilere eklendi", description: `"${term}" kaydedildi.` });
        },
      });
    }
  }

  const actionBtn = (onClick: () => void, icon: React.ReactNode, label: string, accent: string, testId: string) => (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-semibold text-xs btn-press transition-colors"
      style={{ background: `rgba(${accent},0.08)`, border: `1px solid rgba(${accent},0.2)`, color: `rgb(${accent})` }}
      data-testid={testId}
    >
      {icon}
      {label}
    </button>
  );

  const favIsPending = addFavMutation.isPending || removeFavMutation.isPending;

  return (
    <div className="flex flex-col gap-5">

      {/* Back + title */}
      <div className="flex items-start gap-3">
        <button onClick={() => setLocation("/")} className="mt-0.5 p-1.5 rounded-lg btn-press flex-shrink-0"
          style={{ color: 'rgba(160,190,168,0.5)', background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono mb-0.5" style={{ color: 'rgba(0,255,65,0.45)' }}>KAVRAM AÇIKLAMASI</p>
          <h1 className="text-xl font-bold font-mono text-gradient-green truncate">{term}</h1>
        </div>
        <button
          onClick={handleFavorite}
          disabled={favIsPending}
          className="mt-0.5 p-2 rounded-lg btn-press flex-shrink-0 disabled:opacity-50"
          style={{
            background: isFavorited ? 'rgba(250,200,0,0.1)' : 'rgba(0,255,65,0.05)',
            border: `1px solid ${isFavorited ? 'rgba(250,200,0,0.3)' : 'rgba(0,255,65,0.1)'}`,
            color: isFavorited ? '#facc15' : 'rgba(160,190,168,0.4)',
            transition: 'background 200ms, border-color 200ms, color 200ms',
          }}
          data-testid="btn-favorite"
          title={isFavorited ? "Favorilerden kaldır" : "Favorilere ekle"}
        >
          <Star className={`w-4 h-4 transition-all ${isFavorited ? "fill-yellow-400 scale-110" : "scale-100"}`} />
        </button>
      </div>

      {/* Main explanation card */}
      <div className="rounded-2xl p-5 min-h-[160px]"
        style={{
          background: 'rgba(6,12,8,0.85)',
          border: '1px solid rgba(0,255,65,0.1)',
          backdropFilter: 'blur(20px)',
        }}>
        {isStreaming && explanation.length === 0 && (
          <div className="flex items-center gap-2.5" style={{ color: 'rgba(0,255,65,0.6)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-sm">Yapay zeka açıklıyor...</span>
          </div>
        )}
        <div>{renderText(explanation)}</div>
        {isStreaming && explanation.length > 0 && (
          <span className="cursor-blink" />
        )}
      </div>

      {/* Actions */}
      {!isStreaming && explanation && (
        <div className="flex gap-2">
          {actionBtn(handleDeepen, <Zap className="w-3.5 h-3.5" />, "Derinleştir", "0,180,220", "btn-deepen")}
          {actionBtn(handleRoadmap, <Map className="w-3.5 h-3.5" />, "Yol Haritası", "0,255,65", "btn-roadmap")}
          {actionBtn(
            () => setLocation(`/quiz/${encodeURIComponent(term)}`),
            <BookOpen className="w-3.5 h-3.5" />,
            "Quiz",
            "200,160,255",
            "btn-quiz"
          )}
        </div>
      )}

      {/* Deep explanation */}
      {showDeep && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(0,120,160,0.07)', border: '1px solid rgba(0,180,220,0.18)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: '#00b4dc' }} />
            <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(0,180,220,0.7)' }}>DERİNLEMESİNE AÇIKLAMA</p>
          </div>
          {isDeepening && deepText.length === 0 && (
            <div className="flex items-center gap-2" style={{ color: 'rgba(0,180,220,0.6)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono text-sm">Yükleniyor...</span>
            </div>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(200,230,240,0.85)' }}>
            {deepText}
          </div>
          {isDeepening && deepText.length > 0 && <span className="cursor-blink" />}
        </div>
      )}

      {/* Roadmap */}
      {showRoadmap && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.12)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: '#00ff41' }} />
            <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(0,255,65,0.6)' }}>ÖĞRENİM YOL HARİTASI</p>
          </div>
          {roadmapMutation.isPending && (
            <div className="flex items-center gap-2" style={{ color: 'rgba(0,255,65,0.5)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono text-sm">Oluşturuluyor...</span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {roadmap?.steps?.map((step: any) => (
              <div key={step.order} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: 'rgba(0,255,65,0.12)', border: '1px solid rgba(0,255,65,0.3)', color: '#00ff41' }}>
                  {step.order}
                </div>
                <div>
                  <p className="font-mono font-semibold text-sm mb-0.5" style={{ color: 'rgba(220,240,225,0.9)' }}>{step.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(160,190,168,0.6)' }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
