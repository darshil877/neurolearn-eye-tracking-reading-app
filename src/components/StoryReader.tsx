import { useEffect, useMemo, useRef, useState } from "react";
import { AdaptiveText } from "./AdaptiveText";
import { GazeTracker } from "./GazeTracker";
import { PhonicsGame } from "./PhonicsGame";
import type { WordBox } from "@/lib/gaze/tracker";
import type { Story } from "@/lib/db";
import { useStore } from "@/lib/store";
import { GAZE_CONFIG } from "@/lib/config";
import { generatePhonics, type PhonicsExercise } from "@/lib/phonics";
import { ArrowLeft, Play, Pause, Sparkles, X, Info, Volume2 } from "lucide-react";

interface Props {
  story: Story;
  onDone: (args: { flagged: boolean; struggledWords: string[]; regressionRate: number; avgFixation: number }) => void;
}

type Phase = "intro" | "reading" | "loading-phonics" | "phonics" | "summary";

export function StoryReader({ story, onDone }: Props) {
  const student = useStore((s) => s.selectedStudent);
  const adaptationLevel = useStore((s) => s.adaptationLevel);
  const liveStats = useStore((s) => s.liveStats);
  const resetLiveStats = useStore((s) => s.resetLiveStats);
  const navigate = useStore((s) => s.navigate);

  const [phase, setPhase] = useState<Phase>("intro");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [gaze, setGaze] = useState<{ x: number; y: number } | null>(null);
  const [phonics, setPhonics] = useState<PhonicsExercise | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const wordBoxesRef = useRef<WordBox[]>([]);
  const startRef = useRef<number>(0);

  // Timer
  useEffect(() => {
    if (!running || paused) return;
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 250);
    return () => clearInterval(id);
  }, [running, paused]);

  // When adaptation ramps, show a subtle "making text easier…" toast
  const prevLevel = useRef(0);
  useEffect(() => {
    if (phase !== "reading") return;
    if (adaptationLevel > prevLevel.current) {
      prevLevel.current = adaptationLevel;
      // no disruptive UI — adaptations just fade in
    }
  }, [adaptationLevel, phase]);

  const struggledWords = useMemo(() => {
    const entries = Object.entries(liveStats.struggledWords);
    return new Set(entries.filter(([, c]) => c >= 2).map(([w]) => w));
  }, [liveStats.struggledWords]);

  // The global hook lets GazeTracker push gaze samples up to us via window.
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const s = (window as any).__latestGaze;
      if (s) setGaze(s);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleStart() {
    resetLiveStats();
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setPaused(false);
    setPhase("reading");
    prevLevel.current = 0;
  }

  function handlePauseToggle() {
    setPaused((p) => {
      if (!p) {
        setRunning(false);
      } else {
        startRef.current = Date.now() - elapsed;
        setRunning(true);
      }
      return !p;
    });
  }

  async function handleFinish() {
    setRunning(false);
    const regRate =
      liveStats.saccades >= GAZE_CONFIG.MIN_SACCADES_FOR_FLAG
        ? liveStats.regressions / Math.max(1, liveStats.saccades)
        : 0;
    const flagged =
      regRate > GAZE_CONFIG.REGRESSION_RATE_THRESHOLD &&
      liveStats.avgFixation > GAZE_CONFIG.LONG_FIXATION_MS;
    const struggled = Object.entries(liveStats.struggledWords)
      .filter(([, c]) => c >= 2)
      .map(([w]) => w);
    setPhase("loading-phonics");
    const ex = await generatePhonics(story.language, struggled);
    setPhonics(ex);
    setPhase("phonics");
    onDone({
      flagged,
      struggledWords: struggled,
      regressionRate: regRate,
      avgFixation: liveStats.avgFixation || 0,
    });
  }

  function handlePhonicsFinish() {
    setPhase("summary");
  }

  const regRate =
    liveStats.saccades > 0 ? (liveStats.regressions / liveStats.saccades) * 100 : 0;
  const approachingThreshold = regRate > 20;

  if (phase === "intro") {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
          <button
            onClick={() => navigate({ name: "dashboard" })}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Sparkles className="w-3.5 h-3.5" /> Story time, {student?.name?.split(" ")[0]}!
          </div>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 font-opendyslexic">
            {story.title}
          </h1>
          <p className="mt-2 text-slate-600">
            Read the story out loud at your own pace. If you get stuck on a word, that's totally fine —
            the app will quietly make the letters a little bigger and easier to see to help you out.
          </p>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-indigo-500" /> No one is recording you — just read normally.</li>
            <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Letters can change size to help you read.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-indigo-700"
            >
              <Play className="w-4 h-4" /> Start reading
            </button>
          </div>
        </div>

        <GazeTracker running={false} onInfoClick={() => setShowInfo(true)} />
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </div>
    );
  }

  if (phase === "loading-phonics") {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-slate-200">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Preparing a quick game…</h2>
        <p className="mt-1 text-slate-500 text-sm">Based on the words you just read.</p>
      </div>
    );
  }

  if (phase === "phonics" && phonics) {
    return (
      <div className="py-8">
        <PhonicsGame exercise={phonics} onFinish={handlePhonicsFinish} />
      </div>
    );
  }

  if (phase === "summary") {
    const flagged =
      liveStats.saccades >= GAZE_CONFIG.MIN_SACCADES_FOR_FLAG &&
      liveStats.regressions / Math.max(1, liveStats.saccades) > GAZE_CONFIG.REGRESSION_RATE_THRESHOLD &&
      liveStats.avgFixation > GAZE_CONFIG.LONG_FIXATION_MS;
    return (
      <div className="max-w-2xl mx-auto rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Great reading!</h2>
        <p className="mt-2 text-slate-600">
          {flagged
            ? "We noticed a few words took a bit more time. Your grown-up will get a friendly note about it."
            : "You read smoothly today — nice job!"}
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-left">
          <MiniStat label="Regressions" value={`${Math.round(regRate)}%`} />
          <MiniStat label="Avg fixation" value={`${Math.round(liveStats.avgFixation)}ms`} />
          <MiniStat label="Long fixations" value={liveStats.longFixations.toString()} />
        </div>
        <button
          onClick={() => navigate({ name: "dashboard" })}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  // phase === "reading"
  return (
    <div className="max-w-4xl mx-auto">
      <GazeTracker
        running={running}
        onInfoClick={() => setShowInfo(true)}
        onWordBoxesChange={(b) => (wordBoxesRef.current = b)}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            setRunning(false);
            navigate({ name: "dashboard" });
          }}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow ring-1 ring-slate-200">
          {approachingThreshold && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Sparkles className="w-3 h-3" /> Making text easier…
            </span>
          )}
          <span className="text-slate-500">
            ⏱ {Math.floor(elapsed / 1000)}s • Regressions {Math.round(regRate)}% • Fixations{" "}
            {Math.round(liveStats.avgFixation)}ms
          </span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={handlePauseToggle}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {paused || !running ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {paused || !running ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleFinish}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700"
          >
            I'm done →
          </button>
        </div>
      </div>

      <AdaptiveText
        body={story.body}
        gazeX={gaze?.x ?? null}
        gazeY={gaze?.y ?? null}
        adaptationLevel={adaptationLevel}
        struggledWords={Object.fromEntries([...struggledWords].map((w) => [w, 2]))}
        onWordBoxes={(b) => {
          wordBoxesRef.current = b;
          (window as any).__setWordBoxes?.(b);
        }}
      />

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Info className="w-3.5 h-3.5" /> What this app is doing
        </div>
        <h3 className="mt-3 text-xl font-bold text-slate-900">No diagnosis, no uploads.</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>• Your camera turns on <strong>only</strong> after a grown-up has given consent.</li>
          <li>• Video is processed entirely on this device. Nothing is ever recorded or sent to a server.</li>
          <li>• We look for small reading patterns: long pauses on a word, or looking back at words a lot.</li>
          <li>• When we see that, the app quietly makes text easier to read (bigger letters, friendlier font, warmer background).</li>
          <li>• After the session, your grown-up can see if you might benefit from seeing a reading specialist.</li>
          <li>• <strong>This is a prototype and does NOT diagnose dyslexia.</strong></li>
        </ul>
        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
