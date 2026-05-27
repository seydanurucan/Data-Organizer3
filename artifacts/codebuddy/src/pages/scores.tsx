import { useLocation } from "wouter";
import { Trophy, BookOpen, TrendingUp } from "lucide-react";
import { useListQuizScores, getListQuizScoresQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

export default function Scores() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  const { data: scores, isLoading } = useListQuizScores({
    query: { queryKey: getListQuizScoresQueryKey(), enabled: !!token },
    request: { headers: { Authorization: `Bearer ${token}` } },
  });

  const avgScore = scores?.length
    ? Math.round(scores.reduce((acc: number, s: any) => acc + (s.score / s.total) * 100, 0) / scores.length)
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1">ISTATISTIKLER</p>
        <h1 className="text-2xl font-bold text-gradient font-mono">Quiz Sonuclari</h1>
      </div>

      {scores && scores.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-1">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <p className="text-2xl font-bold text-white font-mono">{scores.length}</p>
            <p className="text-xs text-muted-foreground">Quiz Tamamlandi</p>
          </div>
          <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-1">
            <TrendingUp className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold text-white font-mono">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">Ortalama Basari</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />)}
        </div>
      )}

      {!isLoading && (!scores || scores.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <Trophy className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-mono text-sm">Henuz quiz tamamlamadiniz.</p>
          <button onClick={() => setLocation("/")} className="text-primary text-sm hover:underline font-mono">
            Bir terim arayip test baslatabilirsiniz
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {scores?.map((score: any) => {
          const pct = Math.round((score.score / score.total) * 100);
          return (
            <div key={score.id} className="glass-card rounded-xl p-4 flex items-center gap-4 group cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setLocation(`/quiz/${encodeURIComponent(score.term)}`)} data-testid={`card-score-${score.id}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 ${pct >= 70 ? "border-primary text-primary" : pct >= 40 ? "border-secondary text-secondary" : "border-destructive text-destructive"}`}>
                {pct}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-white truncate">{score.term}</p>
                <p className="text-xs text-muted-foreground font-mono">{score.score}/{score.total} dogru &bull; {new Date(score.createdAt).toLocaleDateString("tr-TR")}</p>
              </div>
              <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
