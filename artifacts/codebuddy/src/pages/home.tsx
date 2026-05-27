import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

const TRENDING = [
  "c# döngüler",
  "html div",
  "css flexbox",
  "python liste",
  "javascript async",
  "sql join",
  "react hooks",
  "git commit",
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [term, setTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) setLocation(`/explain/${encodeURIComponent(q)}`);
  };

  const handleTag = (tag: string) => {
    setLocation(`/explain/${encodeURIComponent(tag)}`);
  };

  return (
    <div className="flex flex-col items-center gap-7 pt-6 pb-4">

      {/* Title block */}
      <div className="text-center space-y-1">
        <h1
          className="text-2xl font-bold font-mono tracking-tight text-gradient-green"
          style={{ letterSpacing: '-0.01em' }}
        >
          CodeBuddy
        </h1>
        <p
          className="text-xs font-mono"
          style={{ color: 'rgba(100,140,110,0.55)', letterSpacing: '0.04em' }}
        >
          ai destekli kod asistanı
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="w-full">
        <div
          className="flex items-center rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(6, 14, 8, 0.82)',
            border: '1px solid rgba(0,255,65,0.16)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 0 28px rgba(0,255,65,0.04)',
          }}
        >
          <Search
            className="w-4 h-4 ml-4 flex-shrink-0"
            style={{ color: 'rgba(0,255,65,0.35)' }}
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="bir terim ya da kavram yaz..."
            className="flex-1 bg-transparent outline-none py-3.5 px-3 text-sm font-mono"
            style={{ color: 'rgba(215,240,220,0.88)', caretColor: '#00ff41' }}
            data-testid="input-search"
          />
          <button
            type="submit"
            className="m-1.5 px-5 py-2 rounded-xl font-mono font-bold text-xs tracking-widest btn-press flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #00e035, #00c42c)',
              color: '#030a04',
              letterSpacing: '0.1em',
              boxShadow: '0 0 14px rgba(0,255,65,0.2)',
            }}
            data-testid="btn-search"
          >
            SORGULA
          </button>
        </div>
      </form>

      {/* Robot + CTA text */}
      <div className="flex flex-col items-center gap-2 py-2">
        <span style={{ fontSize: '52px', lineHeight: 1 }}>🤖</span>
        <p
          className="text-base font-mono font-semibold mt-2"
          style={{ color: 'rgba(200,225,208,0.7)' }}
        >
          Ne öğrenmek istiyorsun?
        </p>
        <p
          className="text-xs font-mono text-center max-w-[260px] leading-relaxed"
          style={{ color: 'rgba(110,145,118,0.45)' }}
        >
          Bir kod terimi veya kavram yaz, sana arkadaşın gibi açıklayayım.
        </p>
      </div>

      {/* Trending tags */}
      <div className="flex flex-wrap justify-center gap-2 px-2">
        {TRENDING.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTag(tag)}
            className="font-mono text-xs btn-press"
            style={{
              padding: '5px 13px',
              borderRadius: '999px',
              background: 'transparent',
              border: '1px solid rgba(0,255,65,0.18)',
              color: 'rgba(0,220,55,0.65)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              transition: 'border-color 120ms, color 120ms, background 120ms',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.borderColor = 'rgba(0,255,65,0.5)';
              el.style.color = '#00ff41';
              el.style.background = 'rgba(0,255,65,0.06)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.borderColor = 'rgba(0,255,65,0.18)';
              el.style.color = 'rgba(0,220,55,0.65)';
              el.style.background = 'transparent';
            }}
            data-testid={`tag-${tag.replace(/\s+/g, '-')}`}
          >
            {tag}
          </button>
        ))}
      </div>

    </div>
  );
}
