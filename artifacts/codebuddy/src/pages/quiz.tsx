import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    generateMutation.mutate({ data: { term } });
  }, [term]);

  useEffect(() => {
    if (generateMutation.data?.questions) {
      setQuestions(generateMutation.data.questions);
    }
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
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
    setScoreSaved(false);
    generateMutation.mutate({ data: { term } });
    setQuestions([]);
  };

  if (generateMutation.isPending || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-primary text-sm animate-pulse">Quiz hazirlaniyor...</p>
      </div>
    );
  }

  if (showResult) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500 pt-8">
        <Trophy className={`w-16 h-16 ${pct >= 70 ? "text-yellow-400" : "text-muted-foreground"}`} />
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient font-mono">{score}/{total}</h2>
          <p className="text-muted-foreground font-mono text-sm mt-1">{pct}% basari</p>
          <p className="text-white mt-3 font-semibold">{pct >= 80 ? "Muhtesem! Konuya hakimsin." : pct >= 50 ? "Iyi! Biraz daha calisabilirsin." : "Tekrar etmeni oneririm."}</p>
        </div>

        <div className="w-full glass-card rounded-xl p-4">
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
            <span>BASARI ORANI</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button onClick={restart} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 font-mono active:scale-95" data-testid="btn-restart-quiz">
            <RotateCcw className="w-4 h-4 mr-2" /> Tekrar Dene
          </Button>
          <Button onClick={() => setLocation(`/explain/${encodeURIComponent(term)}`)} className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-black font-mono active:scale-95" data-testid="btn-back-to-explain">
            <ChevronRight className="w-4 h-4 mr-2" /> Aciklamaya Don
          </Button>
          <Button onClick={() => setLocation("/scores")} variant="ghost" className="text-muted-foreground hover:text-white font-mono text-sm" data-testid="btn-see-scores">
            Tum Sonuclari Gor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-mono">QUIZ: {term.toUpperCase()}</p>
          <p className="text-lg font-bold text-white font-mono">Soru {current + 1}/{total}</p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < answers.length ? (answers[i] ? "bg-primary" : "bg-destructive") : i === current ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((current) / total) * 100}%` }} />
      </div>

      <div className="glass-card rounded-xl p-5">
        <p className="text-white font-semibold text-base leading-relaxed" data-testid="text-question">{q.question}</p>
      </div>

      <div className="flex flex-col gap-3">
        {q.options.map((opt, idx) => {
          let style = "border-white/10 hover:border-primary/50 hover:bg-primary/5 text-foreground";
          if (selected !== null) {
            if (idx === q.correctIndex) style = "border-primary bg-primary/20 text-primary";
            else if (idx === selected && idx !== q.correctIndex) style = "border-destructive bg-destructive/20 text-destructive";
            else style = "border-white/5 text-muted-foreground";
          }
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full p-4 rounded-xl border glass-card text-left font-mono text-sm transition-all active:scale-95 flex items-center gap-3 ${style}`}
              disabled={selected !== null}
              data-testid={`btn-option-${idx}`}
            >
              {selected !== null && idx === q.correctIndex && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
              {selected !== null && idx === selected && idx !== q.correctIndex && <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
              {(selected === null || (idx !== q.correctIndex && idx !== selected)) && (
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">{String.fromCharCode(65 + idx)}</span>
              )}
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={`glass-card rounded-xl p-4 border-l-2 animate-in fade-in duration-300 ${selected === q.correctIndex ? "border-l-primary" : "border-l-destructive"}`}>
          <p className={`font-mono text-xs mb-1 ${selected === q.correctIndex ? "text-primary" : "text-destructive"}`}>
            {selected === q.correctIndex ? "DOGRU!" : "YANLIS"}
          </p>
          <p className="text-sm text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}
