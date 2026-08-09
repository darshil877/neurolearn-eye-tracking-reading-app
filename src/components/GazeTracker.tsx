import { useEffect, useRef, useState } from "react";
import { createLiveTracker, createDemoTracker, type GazeTracker, type WordBox } from "@/lib/gaze/tracker";
import { DEMO_MODE } from "@/lib/config";
import { useStore } from "@/lib/store";
import { Info, Eye, EyeOff, AlertTriangle, Camera } from "lucide-react";

interface GazeTrackerProps {
  onWordBoxesChange?: (boxes: WordBox[]) => void;
  // external control: running starts when session is active
  running: boolean;
  onInfoClick?: () => void;
}

/**
 * Manages the FaceMesh/demo tracker lifecycle. Renders a small preview
 * in the corner (just for debugging — in demo mode it shows a simulated
 * gaze dot instead). Pumps events into the zustand store.
 */
export function GazeTracker({ running, onWordBoxesChange, onInfoClick }: GazeTrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<GazeTracker | null>(null);
  const rafRef = useRef<number | null>(null);
  const [gaze, setGaze] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const bumpAdaptation = useStore((s) => s.bumpAdaptation);
  const recordEvent = useStore((s) => s.recordEvent);
  const hesitancyEvents = useStore((s) => s.hesitancyEvents);

  // Instantiate tracker (demo or live)
  useEffect(() => {
    trackerRef.current = DEMO_MODE ? createDemoTracker() : createLiveTracker();
    return () => {
      trackerRef.current?.stop();
    };
  }, []);

  // Wire word boxes up to parent
  const lastBoxes = useRef<WordBox[]>([]);
  useEffect(() => {
    const t = trackerRef.current;
    if (!t) return;
    t.setWordBoxes(lastBoxes.current);
  }, []);
  const setBoxes = (b: WordBox[]) => {
    lastBoxes.current = b;
    trackerRef.current?.setWordBoxes(b);
    onWordBoxesChange?.(b);
  };
  // Expose via window for AdaptiveText's onWordBoxes callback by attaching
  // to a global the parent can find — but we'll instead lift up via props.
  // To keep the parent API simple we expose setBoxes through a listener.
  (window as any).__setWordBoxes = setBoxes;

  // Start/stop with running prop
  useEffect(() => {
    const t = trackerRef.current;
    if (!t) return;
    if (running && !started) {
      setError(null);
      t.start(videoRef.current!)
        .then(() => setStarted(true))
        .catch((e) => {
          setError(DEMO_MODE ? null : (e?.message || "Could not start camera"));
        });
    }
    if (!running && started) {
      t.stop();
      setStarted(false);
      setGaze(null);
    }
    return () => {
      if (started) {
        t.stop();
        setStarted(false);
      }
    };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  // rAF loop: pull sample + events
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = trackerRef.current;
      if (!t) return;
      const s = t.sample();
      if (s) {
        setGaze({ x: s.x, y: s.y });
        (window as any).__latestGaze = { x: s.x, y: s.y };
      }
      const evs = t.flushEvents();
      for (const e of evs) {
        recordEvent({
          type: e.type,
          word: (e as any).word || (e as any).fromWord + "→" + (e as any).toWord,
          durationMs: (e as any).durationMs || 0,
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, recordEvent]);

  // bump adaptation when hesitancy crosses thresholds
  useEffect(() => {
    if (!running) return;
    // every 6 hesitancy events, bump level
    const expectedLevel = Math.min(4, Math.floor(hesitancyEvents / 6));
    const current = useStore.getState().adaptationLevel;
    if (expectedLevel > current) {
      bumpAdaptation();
    }
  }, [hesitancyEvents, running, bumpAdaptation]);

  return (
    <>
      {/* Hidden video element (small, corner preview) */}
      {!DEMO_MODE && (
        <div className="fixed bottom-4 right-4 z-40 overflow-hidden rounded-2xl shadow-xl ring-2 ring-amber-300/60 bg-slate-900 w-40 h-28">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-2 text-[11px] text-white text-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
          {!started && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-amber-200 text-[11px] font-medium gap-1">
              <Camera className="w-4 h-4" /> Starting camera…
            </div>
          )}
        </div>
      )}

      {/* Gaze cursor dot */}
      {running && gaze && (
        <div
          className="pointer-events-none fixed z-50 rounded-full bg-rose-500/70 ring-2 ring-white/90 shadow-[0_0_12px_rgba(244,63,94,0.9)] transition-transform"
          style={{
            width: 24,
            height: 24,
            left: `calc(${gaze.x * 100}% - 12px)`,
            top: `calc(${gaze.y * 100}% - 12px)`,
          }}
        />
      )}

      {/* Persistent "what is this app doing?" button */}
      <button
        onClick={onInfoClick}
        className="fixed top-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-white"
      >
        <Info className="w-3.5 h-3.5 text-indigo-500" />
        {DEMO_MODE ? "Demo Mode" : "Privacy info"}
      </button>

      {/* Tracker status chip */}
      <div className="fixed top-4 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow ring-1 ring-slate-200">
        {running ? (
          <>
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>{DEMO_MODE ? "Simulated reading" : "Eye tracking on"}</span>
          </>
        ) : (
          <>
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Tracker off</span>
          </>
        )}
      </div>

      {/* Hidden slot for AdaptiveText to call setBoxes */}
      <SetBoxesBridge setBoxes={setBoxes} />
    </>
  );
}

// Bridge component that reads the global setter populated by AdaptiveText.
// AdaptiveText calls the global from inside; we forward to the real setter.
function SetBoxesBridge({ setBoxes }: { setBoxes: (b: WordBox[]) => void }) {
  useEffect(() => {
    (window as any).__setWordBoxes = setBoxes;
    return () => {
      (window as any).__setWordBoxes = undefined;
    };
  }, [setBoxes]);
  return null;
}
