import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronLeft, Loader2 } from "lucide-react";
import { useGenerateQuiz, useSaveQuizScore, getListQuizScoresQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

type Question = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function Quiz() {
  const params = useParams<{ term: string }>();
  const term = decodeURIComponent(params.term ?? "");
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const generateMutation = useGenerateQuiz();
  const saveScoreMutation = useSaveQuizScore();

  useEffect(() => { generateMutation.mutate({ data: { term } }); }, [term]);
  useEffect(() => {
    if (generateMutation.data?.questions) setQuestions(generateMutation.data.questions);
  }, [generateMutation.data]);

  useEffect(() => {
    if (showResult && !scoreSaved && questions.length > 0 && token) {
      const score = answers.filter(Boolean).length;
      saveScoreMutation.mutate({ data: { term, score, total: questions.length } }, {
        onSuccess: () => {
          setScoreSaved(true);
          queryClient.invalidateQueries({ queryKey: getListQuizScoresQueryKey() });
        },
      });
    }
  }, [showResult]);

  const q = questions[current];
  const total = questions.length;
  const score = answers.filter(Boolean).length;

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      const correct = idx === q.correctIndex;
      setAnswers(prev => [...prev, correct]);
      if (current + 1 >= total) {
        setShowResult(true);
      } else {
        setCurrent(prev => prev + 1);
        setSelected(null);
      }
    }, 1200);
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setAnswers([]); setShowResult(false); setScoreSaved(false);
    setQuestions([]);
    generateMutation.mutate({ data: { term } });
  };

  if (generateMutation.isPending || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)' }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00ff41' }} />
        </div>
        <p className="font-mono text-sm" style={{ color: 'rgba(0,255,65,0.5)' }}>Quiz hazırlanıyor...</p>
        <p className="font-mono text-xs" style={{ color: 'rgba(140,170,148,0.35)' }}>{term}</p>
      </div>
    );
  }

  if (showResult) {
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚";
    const msg = pct >= 80 ? "Müthiş! Konuya gerçekten hakimsin." : pct >= 50 ? "İyi gidiyorsun! Biraz daha pratik yapabilirsin." : "Tekrar etmeni öneririm, anlayış derinleşecek.";

    return (
      <div className="flex flex-col items-center gap-6 pt-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'rgba(0,255,65,0.07)', border: '1px solid rgba(0,255,65,0.2)' }}>
          {emoji}
        </div>

        <div className="text-center">
          <p className="font-mono text-xs mb-1" style={{ color: 'rgba(0,255,65,0.45)' }}>SONUÇ</p>
          <p className="text-4xl font-bold font-mono text-gradient-green">{score}/{total}</p>
          <p className="text-lg font-mono mt-1" style={{ color: 'rgba(200,230,210,0.6)' }}>{pct}% başarı</p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(180,210,188,0.7)' }}>{msg}</p>
        </div>

        <div className="w-full rounded-2xl p-4"
          style={{ background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.1)' }}>
          <div className="flex justify-between text-xs font-mono mb-2" style={{ color: 'rgba(0,255,65,0.5)' }}>
            <span>BAŞARI ORANI</span><span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00cc2e, #00ff41)' }} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button onClick={restart} className="w-full py-3.5 rounded-xl font-mono font-bold text-sm btn-press flex items-center justify-center gap-2"
            style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', color: '#00ff41' }}
            data-testid="btn-restart-quiz">
            <RotateCcw className="w-4 h-4" /> Tekrar Dene
          </button>
          <button onClick={() => setLocation(`/explain/${encodeURIComponent(term)}`)}
            className="w-full py-3.5 rounded-xl font-mono font-bold text-sm btn-press flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00e838, #00cc2e)', color: '#020902' }}
            data-testid="btn-back-to-explain">
            Açıklamaya Dön
          </button>
          <button onClick={() => setLocation("/scores")}
            className="w-full py-2.5 rounded-xl font-mono text-sm btn-press"
            style={{ color: 'rgba(140,170,148,0.5)' }}
            data-testid="btn-see-scores">
            Tüm Sonuçları Gör
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation(`/explain/${encodeURIComponent(term)}`)}
          className="p-1.5 rounded-lg btn-press flex-shrink-0"
          style={{ color: 'rgba(160,190,168,0.5)', background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono" style={{ color: 'rgba(0,255,65,0.45)' }}>QUİZ: {term.toUpperCase()}</p>
          <p className="font-mono font-bold text-sm" style={{ color: 'rgba(220,240,225,0.9)' }}>
            Soru {current + 1} / {total}
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{
                background: i < answers.length
                  ? answers[i] ? '#00ff41' : '#ff5555'
                  : i === current ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
              }} />
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%`, background: 'linear-gradient(90deg, #00cc2e, #00ff41)' }} />
      </div>

      {/* Question */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(6,12,8,0.85)', border: '1px solid rgba(0,255,65,0.1)', backdropFilter: 'blur(16px)' }}>
        <p className="font-semibold text-base leading-relaxed" style={{ color: 'rgba(220,240,225,0.92)' }} data-testid="text-question">
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt, idx) => {
          let bg = 'rgba(8,14,10,0.7)';
          let border = 'rgba(255,255,255,0.07)';
          let color = 'rgba(200,220,205,0.8)';
          if (selected !== null) {
            if (idx === q.correctIndex) { bg = 'rgba(0,255,65,0.1)'; border = 'rgba(0,255,65,0.4)'; color = '#00ff41'; }
            else if (idx === selected) { bg = 'rgba(255,60,60,0.1)'; border = 'rgba(255,60,60,0.4)'; color = '#ff5555'; }
            else { bg = 'rgba(0,0,0,0.3)'; border = 'rgba(255,255,255,0.04)'; color = 'rgba(140,160,145,0.4)'; }
          }
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className="w-full p-4 rounded-xl text-left font-mono text-sm btn-press flex items-center gap-3 transition-all"
              style={{ background: bg, border: `1px solid ${border}`, color, backdropFilter: 'blur(8px)' }}
              data-testid={`btn-option-${idx}`}
            >
              {selected !== null && idx === q.correctIndex && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff41' }} />}
              {selected !== null && idx === selected && idx !== q.correctIndex && <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ff5555' }} />}
              {(selected === null || (idx !== q.correctIndex && idx !== selected)) && (
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0"
                  style={{ borderColor: 'currentColor', opacity: 0.5 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
              )}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {selected !== null && (
        <div className="rounded-2xl p-4"
          style={{
            background: selected === q.correctIndex ? 'rgba(0,255,65,0.05)' : 'rgba(255,60,60,0.05)',
            border: `1px solid ${selected === q.correctIndex ? 'rgba(0,255,65,0.2)' : 'rgba(255,60,60,0.2)'}`,
          }}>
          <p className="font-mono font-bold text-xs mb-1.5" style={{ color: selected === q.correctIndex ? '#00ff41' : '#ff5555' }}>
            {selected === q.correctIndex ? 'DOĞRU!' : 'YANLIŞ'}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(180,210,188,0.7)' }}>{q.explanation}</p>
        </div>
      )}
    </div>
  );
}
