import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Terminal, Code2, BrainCircuit, Layers } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [term, setTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      setLocation(`/explain/${encodeURIComponent(term.trim())}`);
    }
  };

  const categories = [
    {
      name: "React",
      icon: "⚛",
      color: "rgba(0,180,220,0.15)",
      border: "rgba(0,180,220,0.25)",
      terms: ["useEffect", "useState", "Context API", "useCallback", "useMemo"],
    },
    {
      name: "JavaScript",
      icon: "JS",
      color: "rgba(240,200,0,0.08)",
      border: "rgba(240,200,0,0.2)",
      terms: ["Promise", "Closure", "Event Loop", "async/await", "Prototype"],
    },
    {
      name: "Python",
      icon: "Py",
      color: "rgba(0,255,65,0.07)",
      border: "rgba(0,255,65,0.18)",
      terms: ["List Comprehension", "Decorator", "Generator", "Lambda", "Class"],
    },
    {
      name: "Veri Yapıları",
      icon: "{}",
      color: "rgba(180,80,255,0.08)",
      border: "rgba(180,80,255,0.2)",
      terms: ["Stack", "Queue", "Hash Map", "Binary Tree", "Linked List"],
    },
  ];

  return (
    <div className="flex flex-col gap-7">

      {/* Hero */}
      <div className="pt-2 pb-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="tag-pill">Yapay Zeka Destekli</span>
        </div>
        <h1 className="text-3xl font-bold font-mono leading-tight" style={{ lineHeight: '1.2' }}>
          <span className="text-gradient-green">Kodlamayı</span>{" "}
          <span style={{ color: 'rgba(220,240,225,0.9)' }}>Anlamak</span>
          <br />
          <span style={{ color: 'rgba(220,240,225,0.9)' }}>Hiç Bu Kadar</span>{" "}
          <span className="text-gradient-green">Kolay</span>
          <br />
          <span style={{ color: 'rgba(220,240,225,0.9)' }}>Olmamıştı.</span>
        </h1>
        <p className="text-sm font-mono" style={{ color: 'rgba(160,190,168,0.65)' }}>
          Bir kavram yaz, sana Türkçe açıklayayım.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="flex items-center rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,16,10,0.8)',
              border: '1px solid rgba(0,255,65,0.18)',
              boxShadow: '0 0 30px rgba(0,255,65,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}>
            <Search className="w-4 h-4 ml-4 flex-shrink-0" style={{ color: 'rgba(0,255,65,0.45)' }} />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="useEffect, closure, pointer..."
              className="flex-1 bg-transparent outline-none py-4 px-3 text-sm font-mono placeholder:opacity-30"
              style={{ color: 'rgba(220,240,225,0.9)' }}
              data-testid="input-search"
            />
            <button
              type="submit"
              className="m-1.5 px-5 py-2.5 rounded-xl font-mono font-bold text-sm tracking-widest btn-press flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #00e838, #00cc2e)',
                color: '#020902',
                boxShadow: '0 0 16px rgba(0,255,65,0.25)',
                letterSpacing: '0.1em',
              }}
              data-testid="btn-search"
            >
              SORGULA
            </button>
          </div>
        </div>
      </form>

      {/* Categories */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: 'rgba(0,255,65,0.1)' }} />
          <span className="font-mono text-xs tracking-widest" style={{ color: 'rgba(0,255,65,0.5)' }}>
            SİSTEMDEKİ KAVRAMLAR
          </span>
          <div className="h-px flex-1" style={{ background: 'rgba(0,255,65,0.1)' }} />
        </div>

        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="rounded-2xl p-4 scanlines"
              style={{
                background: cat.color,
                border: `1px solid ${cat.border}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: cat.border, color: 'rgba(220,240,225,0.9)' }}>
                  {cat.icon}
                </span>
                <h3 className="font-mono font-semibold text-sm" style={{ color: 'rgba(220,240,225,0.85)' }}>
                  {cat.name}
                </h3>
                <Layers className="w-3 h-3 ml-auto" style={{ color: 'rgba(160,190,168,0.4)' }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.terms.map((t) => (
                  <button
                    key={t}
                    onClick={() => setLocation(`/explain/${encodeURIComponent(t)}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono btn-press transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(200,230,210,0.75)',
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLElement).style.borderColor = 'rgba(0,255,65,0.35)';
                      (e.target as HTMLElement).style.color = '#00ff41';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                      (e.target as HTMLElement).style.color = 'rgba(200,230,210,0.75)';
                    }}
                    data-testid={`btn-term-${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chat CTA */}
      <button
        onClick={() => setLocation('/chat')}
        className="rounded-2xl p-5 text-left btn-press w-full"
        style={{
          background: 'rgba(0,140,200,0.08)',
          border: '1px solid rgba(0,160,220,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,160,220,0.15)', border: '1px solid rgba(0,160,220,0.25)' }}>
            <BrainCircuit className="w-5 h-5" style={{ color: '#00aadd' }} />
          </div>
          <div className="flex-1">
            <p className="font-mono font-semibold text-sm mb-0.5" style={{ color: 'rgba(220,240,245,0.9)' }}>
              AI ile Sohbet Et
            </p>
            <p className="text-xs font-mono" style={{ color: 'rgba(140,180,200,0.55)' }}>
              Kod hataları, proje fikirleri, her şeyi sor.
            </p>
          </div>
          <Code2 className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0,160,220,0.4)' }} />
        </div>
      </button>

    </div>
  );
}
