import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Terminal, BookOpen, BrainCircuit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    { name: "React", terms: ["useEffect", "useState", "Context API"] },
    { name: "JavaScript", terms: ["Promises", "Closures", "Event Loop"] },
    { name: "Python", terms: ["List Comprehension", "Decorators", "Generators"] },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pt-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient font-mono tracking-tight">Access the Mainframe</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          What concept do you want to decode today?
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Type a coding term..."
            className="w-full h-14 pl-12 pr-4 bg-black/50 border-primary/20 text-lg rounded-xl glass-card text-primary placeholder:text-muted-foreground/50 focus-visible:ring-primary focus-visible:border-primary transition-all font-mono"
            data-testid="input-search"
          />
          <Button 
            type="submit" 
            size="sm" 
            className="absolute right-2 h-10 bg-primary/20 text-primary hover:bg-primary hover:text-black transition-colors"
            data-testid="btn-search"
          >
            Decode
          </Button>
        </div>
      </form>

      <div className="space-y-6 mt-4">
        <h2 className="text-sm font-mono text-muted-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Recommended Modules
        </h2>
        
        <div className="grid gap-4">
          {categories.map((cat, i) => (
            <div key={i} className="glass-card p-4 rounded-xl border-t border-white/5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-secondary" /> {cat.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.terms.map((t) => (
                  <button
                    key={t}
                    onClick={() => setLocation(`/explain/${encodeURIComponent(t)}`)}
                    className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all active:scale-95"
                    data-testid={`btn-term-${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-xl mt-4 border-l-2 border-l-secondary relative overflow-hidden group cursor-pointer" onClick={() => setLocation('/chat')}>
        <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors"></div>
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-lg bg-secondary/20">
            <BrainCircuit className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">Enter the Chat</h3>
            <p className="text-xs text-muted-foreground">Talk directly to your AI buddy to debug code or brainstorm ideas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
