import { useEffect, useState } from "react";
import type { PhonicsExercise, PhonicsQuestion } from "@/lib/phonics";
import { Sparkles, Check, X, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
  exercise: PhonicsExercise;
  onFinish: (score: number, total: number) => void;
}

/**
 * A super light multiple-choice phonics matching game.
 * Taps are big, friendly, no timer, no "wrong" noise that would make a kid
 * feel bad — wrong answers just wiggle and let them try again.
 */
export function PhonicsGame({ exercise, onFinish }: Props) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const total = exercise.questions.length;
  const q: PhonicsQuestion | undefined = exercise.questions[idx];

  useEffect(() => {
    setPicked(null);
  }, [idx]);

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-slate-200">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">बहुत बढ़िया! Great job!</h2>
        <p className="mt-2 text-slate-600">You matched {score} / {total} words.</p>
        <button
          onClick={() => onFinish(score, total)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  function pick(opt: string) {
    if (picked || !q) return;
    if (opt === q.answer) {
      setPicked(opt);
      setScore((s) => s + 1);
      setTimeout(() => setIdx((i) => i + 1), 650);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      // let them try again (no penalty)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-6 shadow-xl">
        <div className="flex items-center justify-between text-white">
          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider opacity-90">
            <Sparkles className="w-4 h-4" /> {exercise.title}
          </div>
          <div className="text-sm font-medium opacity-90">
            {idx + 1} / {total}
          </div>
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white leading-snug">
          {q.prompt}
        </h2>
        <p className="mt-1 text-white/80 text-sm">{exercise.instructions}</p>
      </div>

      <div className={cn("mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3", shake && "animate-[wiggle_0.4s_ease-in-out]")}>
        {q.options.map((opt) => {
          const correct = picked === opt && opt === q.answer;
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={cn(
                "group relative rounded-2xl bg-white p-6 text-left shadow-md ring-1 ring-slate-200",
                "text-2xl sm:text-3xl font-semibold text-slate-800 hover:ring-indigo-300 hover:-translate-y-0.5 transition-all",
                correct && "ring-2 ring-emerald-400 bg-emerald-50",
                picked && !correct && opt !== q.answer && "opacity-60"
              )}
            >
              <span className="font-opendyslexic">{opt}</span>
              {correct && (
                <span className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="w-5 h-5" />
                </span>
              )}
              {shake && picked !== opt && opt !== q.answer && null}
              {shake && opt === picked && !correct && (
                <span className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-400 text-white">
                  <X className="w-5 h-5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Tap the word that matches. There are no wrong tries — take your time!
      </p>

      <style>{`
        @keyframes wiggle {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
