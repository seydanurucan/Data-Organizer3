import { useLocation } from "wouter";
import { Trophy, BookOpen, TrendingUp, BarChart2 } from "lucide-react";
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

  const best = scores?.length
    ? Math.max(...scores.map((s: any) => Math.round((s.score / s.total) * 100)))
    : 0;

  return (
    <div className="flex flex-col gap-6">

      <div>
        <p className="text-xs font-mono tracking-widest mb-1" style={{ color: 'rgba(0,255,65,0.45)' }}>PERFORMANS</p>
        <h1 className="text-2xl font-bold font-mono text-gradient-green">Quiz Geçmişi</h1>
      </div>

      {scores && scores.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: <BarChart2 className="w-4 h-4" />, value: `${scores.length}`, label: "Tamamlanan" },
            { icon: <TrendingUp className="w-4 h-4" />, value: `${avgScore}%`, label: "Ortalama" },
            { icon: <Trophy className="w-4 h-4" />, value: `${best}%`, label: "En İyi" },
          ].map(({ icon, value, label }) => (
            <div key={label} className="rounded-2xl p-3 flex flex-col items-center gap-1.5"
              style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}>
              <span style={{ color: 'rgba(0,255,65,0.5)' }}>{icon}</span>
              <p className="text-xl font-bold font-mono" style={{ color: 'rgba(220,240,225,0.9)' }}>{value}</p>
              <p className="text-xs font-mono" style={{ color: 'rgba(140,170,148,0.45)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: 'rgba(0,255,65,0.04)' }} />
          ))}
        </div>
      )}

      {!isLoading && (!scores || scores.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}>
            <Trophy className="w-7 h-7" style={{ color: 'rgba(0,255,65,0.25)' }} />
          </div>
          <div>
            <p className="font-mono text-sm font-semibold mb-1" style={{ color: 'rgba(200,220,205,0.6)' }}>Henüz quiz tamamlamadınız.</p>
            <p className="text-xs font-mono" style={{ color: 'rgba(140,170,148,0.4)' }}>Bir kavram açıklayıp "Quiz" butonuna basın.</p>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="px-4 py-2 rounded-xl font-mono text-xs btn-press"
            style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', color: '#00ff41' }}
          >
            Kavram Ara
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {scores?.map((score: any) => {
          const pct = Math.round((score.score / score.total) * 100);
          const accentColor = pct >= 70 ? 'rgba(0,255,65,0.6)' : pct >= 40 ? 'rgba(0,160,220,0.6)' : 'rgba(255,80,80,0.6)';
          const accentBg = pct >= 70 ? 'rgba(0,255,65,0.07)' : pct >= 40 ? 'rgba(0,160,220,0.07)' : 'rgba(255,80,80,0.07)';
          const accentBorder = pct >= 70 ? 'rgba(0,255,65,0.12)' : pct >= 40 ? 'rgba(0,160,220,0.12)' : 'rgba(255,80,80,0.12)';

          return (
            <button
              key={score.id}
              onClick={() => setLocation(`/quiz/${encodeURIComponent(score.term)}`)}
              className="rounded-2xl p-4 flex items-center gap-4 btn-press text-left w-full"
              style={{ background: 'rgba(6,12,8,0.8)', border: '1px solid rgba(0,255,65,0.07)', backdropFilter: 'blur(12px)' }}
              data-testid={`card-score-${score.id}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor }}>
                {pct}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-sm truncate mb-0.5" style={{ color: 'rgba(220,240,225,0.9)' }}>{score.term}</p>
                <p className="text-xs font-mono" style={{ color: 'rgba(140,170,148,0.45)' }}>
                  {score.score}/{score.total} doğru &bull; {new Date(score.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0,255,65,0.25)' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
