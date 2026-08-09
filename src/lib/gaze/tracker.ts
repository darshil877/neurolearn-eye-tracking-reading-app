// @ts-nocheck
// On-device gaze tracker using MediaPipe FaceMesh (iris landmarks 468–477).
// Everything here runs client-side; no frames leave the browser.
//
// The heuristic here is deliberately simple and clinically naive —
// see src/lib/config.ts for thresholds and the README for the caveats.
// This is NOT a medical device.

import { GAZE_CONFIG } from "../config";

export type GazeSample = {
  t: number;       // timestamp
  x: number;       // normalized 0..1 horizontal gaze on the page
  y: number;       // normalized 0..1 vertical gaze on the page
  confidence: number;
};

export type GazeEvent =
  | { type: "fixation"; wordIndex: number; word: string; durationMs: number }
  | { type: "long_fixation"; wordIndex: number; word: string; durationMs: number }
  | { type: "saccade"; fromWord: number | null; toWord: number }
  | { type: "regression"; fromWord: number; toWord: number };

export type WordBox = {
  index: number;
  word: string;
  // Normalized 0..1 rect across the reading container
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

export type TrackerStatus = "idle" | "starting" | "running" | "error" | "demo";

export interface GazeTracker {
  status: () => TrackerStatus;
  start: (videoEl: HTMLVideoElement) => Promise<void>;
  stop: () => void;
  // Call this every frame from a React rAF loop to pull the latest smoothed sample
  sample: () => GazeSample | null;
  // Attach the current word-box layout (re-computed on resize/font change)
  setWordBoxes: (boxes: WordBox[]) => void;
  // Consume events that have accumulated since last flush
  flushEvents: () => GazeEvent[];
}

// ---------------- MediaPipe implementation ----------------

const FACE_MESH_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

async function loadFaceLandmarker(): Promise<any> {
  const vision = await import("@mediapipe/tasks-vision");
  const { FaceLandmarker, FilesetResolver } = vision as any;
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
  );
  return FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: { modelAssetPath: FACE_MESH_MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

// Helper to map iris center -> normalized screen x/y.
// We use both irises (468..473 left, 473..477 right? actually:
// MediaPipe iris: 468–472 left eye iris, 473–477 right eye iris).
// We average the two iris centers and apply a simple perspective
// remap based on eye corner keypoints.
function computeGaze(landmarks: any, video: HTMLVideoElement): GazeSample | null {
  if (!landmarks || landmarks.length < 478) return null;

  const iL = landmarks[468]; // left iris center
  const iR = landmarks[473]; // right iris center
  const ix = (iL.x + iR.x) / 2;
  const iy = (iL.y + iR.y) / 2;

  // Eye corners for rough normalization: 33 left-eye outer, 133 left-eye inner,
  // 362 right-eye inner, 263 right-eye outer
  const leL = landmarks[33];
  const leR = landmarks[133];
  const reL = landmarks[362];
  const reR = landmarks[263];

  const eyeCenterX = (leL.x + leR.x + reL.x + reR.x) / 4;
  const eyeCenterY = (leL.y + leR.y + reL.y + reR.y) / 4;

  // Displacement of iris from eye center
  let dx = ix - eyeCenterX;
  let dy = iy - eyeCenterY;

  // Iris center is already a decent gaze proxy when head is stationary,
  // but we scale the deviation because iris moves less than the full eye.
  // These are empirical multipliers tuned for the demo.
  dx *= 6.0;
  dy *= 6.0;

  // Mirror because we use the front camera.
  let screenX = 0.5 - dx;
  let screenY = 0.5 + dy;

  // Clamp
  screenX = Math.max(0, Math.min(1, screenX));
  screenY = Math.max(0, Math.min(1, screenY));

  return {
    t: performance.now(),
    x: screenX,
    y: screenY,
    confidence: 0.9,
  };
}

// Find nearest word box to a gaze point, within hit radius.
function hitTestWord(boxes: WordBox[], sample: GazeSample): number | null {
  let best: { idx: number; dist: number } | null = null;
  for (const box of boxes) {
    const dx = sample.x - box.centerX;
    const dy = sample.y - box.centerY;
    // Normalize dist by half-width of word so narrow words are still hittable
    const rx = (box.right - box.left) / 2;
    const ry = (box.bottom - box.top) / 2;
    const nd = Math.sqrt((dx / (rx + 0.02)) ** 2 + (dy / (ry + 0.02)) ** 2);
    if (nd < GAZE_CONFIG.WORD_HIT_RADIUS) {
      if (!best || nd < best.dist) best = { idx: box.index, dist: nd };
    }
  }
  return best ? best.idx : null;
}

export function createLiveTracker(): GazeTracker {
  let faceLandmarker: any = null;
  let videoEl: HTMLVideoElement | null = null;
  let rafId: number | null = null;
  let stream: MediaStream | null = null;
  let lastVideoTime = -1;
  let statusV: TrackerStatus = "idle";

  const window: GazeSample[] = [];
  let wordBoxes: WordBox[] = [];

  // State for fixation/saccade detection
  let currentWordIdx: number | null = null;
  let currentWordStart: number = 0;
  let lastAdvancement: number = 0; // furthest word we've reached
  let totalSaccades = 0;
  let totalRegressions = 0;
  const pendingEvents: GazeEvent[] = [];

  function setWordBoxes(b: WordBox[]) {
    wordBoxes = b;
  }

  function flushEvents(): GazeEvent[] {
    const out = pendingEvents.splice(0, pendingEvents.length);
    return out;
  }

  function smoothSample(raw: GazeSample): GazeSample {
    window.push(raw);
    if (window.length > GAZE_CONFIG.ROLLING_WINDOW_SIZE) window.shift();
    let sx = 0,
      sy = 0;
    for (const s of window) {
      sx += s.x;
      sy += s.y;
    }
    return {
      t: raw.t,
      x: sx / window.length,
      y: sy / window.length,
      confidence: raw.confidence,
    };
  }

  function onFrame() {
    if (!videoEl || !faceLandmarker || statusV !== "running") return;
    const now = performance.now();
    if (videoEl.currentTime !== lastVideoTime) {
      lastVideoTime = videoEl.currentTime;
      try {
        const res = faceLandmarker.detectForVideo(videoEl, now);
        const landmarks = res.faceLandmarks?.[0];
        const raw = computeGaze(landmarks, videoEl);
        if (raw) {
          const smoothed = smoothSample(raw);
          processSample(smoothed);
        }
      } catch (e) {
        console.warn("FaceMesh frame error", e);
      }
    }
    rafId = requestAnimationFrame(onFrame);
  }

  function processSample(s: GazeSample) {
    if (wordBoxes.length === 0) return;
    const hit = hitTestWord(wordBoxes, s);
    if (hit === null) {
      // In between words — close out any open fixation
      if (currentWordIdx !== null) {
        const dur = s.t - currentWordStart;
        if (dur >= GAZE_CONFIG.FIXATION_THRESHOLD_MS) {
          const w = wordBoxes[currentWordIdx].word;
          const ev: GazeEvent = { type: "fixation", wordIndex: currentWordIdx, word: w, durationMs: dur };
          pendingEvents.push(ev);
          if (dur >= GAZE_CONFIG.LONG_FIXATION_MS) {
            pendingEvents.push({ type: "long_fixation", wordIndex: currentWordIdx, word: w, durationMs: dur });
          }
        }
        currentWordIdx = null;
      }
      return;
    }

    if (currentWordIdx === null) {
      // Starting a new fixation
      currentWordIdx = hit;
      currentWordStart = s.t;
      return;
    }

    if (hit === currentWordIdx) {
      // Still fixating
      return;
    }

    // We moved to a new word: end the old fixation
    const dur = s.t - currentWordStart;
    if (dur >= GAZE_CONFIG.FIXATION_THRESHOLD_MS) {
      const w = wordBoxes[currentWordIdx].word;
      pendingEvents.push({ type: "fixation", wordIndex: currentWordIdx, word: w, durationMs: dur });
      if (dur >= GAZE_CONFIG.LONG_FIXATION_MS) {
        pendingEvents.push({ type: "long_fixation", wordIndex: currentWordIdx, word: w, durationMs: dur });
      }
    }

    // Saccade from currentWordIdx -> hit
    totalSaccades += 1;
    pendingEvents.push({ type: "saccade", fromWord: currentWordIdx, toWord: hit });

    if (hit < lastAdvancement && currentWordIdx > hit) {
      // Backward saccade after we had already advanced past it = regression
      totalRegressions += 1;
      pendingEvents.push({ type: "regression", fromWord: currentWordIdx, toWord: hit });
    } else if (hit > lastAdvancement) {
      lastAdvancement = hit;
    }

    currentWordIdx = hit;
    currentWordStart = s.t;
  }

  let latestSample: GazeSample | null = null;
  // Wrap processSample so we also stash latest for the UI cursor
  const origProcess = processSample;
  function processAndStore(s: GazeSample) {
    latestSample = s;
    origProcess(s);
  }
  // (replace binding)
  function onFrame2() {
    if (!videoEl || !faceLandmarker || statusV !== "running") return;
    const now = performance.now();
    if (videoEl.currentTime !== lastVideoTime) {
      lastVideoTime = videoEl.currentTime;
      try {
        const res = faceLandmarker.detectForVideo(videoEl, now);
        const landmarks = res.faceLandmarks?.[0];
        const raw = computeGaze(landmarks, videoEl);
        if (raw) {
          const smoothed = smoothSample(raw);
          processAndStore(smoothed);
        }
      } catch (e) {
        console.warn("FaceMesh frame error", e);
      }
    }
    rafId = requestAnimationFrame(onFrame2);
  }

  return {
    status: () => statusV,
    async start(v: HTMLVideoElement) {
      if (statusV === "running") return;
      statusV = "starting";
      videoEl = v;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        });
        videoEl.srcObject = stream;
        await videoEl.play();
        faceLandmarker = await loadFaceLandmarker();
        statusV = "running";
        lastVideoTime = -1;
        currentWordIdx = null;
        lastAdvancement = 0;
        totalSaccades = 0;
        totalRegressions = 0;
        rafId = requestAnimationFrame(onFrame2);
      } catch (e) {
        statusV = "error";
        console.error("Tracker start failed", e);
        throw e;
      }
    },
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (videoEl) videoEl.srcObject = null;
      faceLandmarker?.close?.();
      faceLandmarker = null;
      statusV = "idle";
    },
    sample() {
      return latestSample;
    },
    setWordBoxes,
    flushEvents,
  };
}

// ---------------- Demo / simulated tracker ----------------
//
// Replays a scripted reading sequence with realistic hesitation &
// regressions so the full adaptive loop can be demoed without a camera,
// with unreliable internet, or under bad lighting on stage.

const DEMO_SCRIPT = [
  // word index, dwell_ms, whether to "stumble" (trigger long fixation + regression)
  { word: 0, dwell: 260 },
  { word: 1, dwell: 240 },
  { word: 2, dwell: 320 },
  { word: 3, dwell: 280 },
  { word: 4, dwell: 250 },
  { word: 5, dwell: 270 },
  { word: 6, dwell: 420, stumble: true },
  { word: 7, dwell: 300 },
  // regression back to word 6, then 5, then forward again
  { word: 6, dwell: 620, stumble: true },
  { word: 5, dwell: 380, stumble: true },
  { word: 7, dwell: 300 },
  { word: 8, dwell: 340 },
  { word: 9, dwell: 500, stumble: true },
  { word: 8, dwell: 300 },
  { word: 9, dwell: 480, stumble: true },
  { word: 10, dwell: 290 },
  { word: 11, dwell: 260 },
  { word: 12, dwell: 270 },
  { word: 13, dwell: 240 },
  { word: 14, dwell: 260 },
];

export function createDemoTracker(): GazeTracker {
  let running = false;
  let wordBoxes: WordBox[] = [];
  const pendingEvents: GazeEvent[] = [];
  let startTime = 0;
  let scriptIdx = 0;
  let lastSample: GazeSample | null = null;
  let currentWordIdx: number | null = null;
  let currentWordStart: number = 0;
  let lastAdvancement = 0;
  let timeouts: number[] = [];

  function setWordBoxes(b: WordBox[]) {
    wordBoxes = b;
  }
  function flushEvents() {
    const out = pendingEvents.splice(0, pendingEvents.length);
    return out;
  }

  function sampleAtWordIdx(idx: number): GazeSample | null {
    const box = wordBoxes[idx];
    if (!box) return null;
    // tiny jitter
    return {
      t: performance.now(),
      x: box.centerX + (Math.random() - 0.5) * 0.01,
      y: box.centerY + (Math.random() - 0.5) * 0.005,
      confidence: 1,
    };
  }

  function processSample(s: GazeSample) {
    // Same logic as live but we drive it from the script.
    const hit = hitTestWord(wordBoxes, s);
    if (hit === null) return;
    if (currentWordIdx === null) {
      currentWordIdx = hit;
      currentWordStart = s.t;
      return;
    }
    if (hit === currentWordIdx) return;
    const dur = s.t - currentWordStart;
    if (dur >= GAZE_CONFIG.FIXATION_THRESHOLD_MS) {
      const w = wordBoxes[currentWordIdx].word;
      pendingEvents.push({ type: "fixation", wordIndex: currentWordIdx, word: w, durationMs: dur });
      if (dur >= GAZE_CONFIG.LONG_FIXATION_MS) {
        pendingEvents.push({ type: "long_fixation", wordIndex: currentWordIdx, word: w, durationMs: dur });
      }
    }
    pendingEvents.push({ type: "saccade", fromWord: currentWordIdx, toWord: hit });
    if (hit < lastAdvancement && currentWordIdx > hit) {
      pendingEvents.push({ type: "regression", fromWord: currentWordIdx, toWord: hit });
    } else if (hit > lastAdvancement) {
      lastAdvancement = hit;
    }
    currentWordIdx = hit;
    currentWordStart = s.t;
  }

  function scheduleNext() {
    if (!running) return;
    const step = DEMO_SCRIPT[scriptIdx % DEMO_SCRIPT.length];
    scriptIdx++;
    // Loop through the script once, then idle on the last word.
    const idx = step.word;
    const box = wordBoxes[idx];
    if (box) {
      const s = sampleAtWordIdx(idx);
      if (s) {
        lastSample = s;
        processSample(s);
        // emit a long-fixation if dwell exceeds threshold
        if (step.dwell >= GAZE_CONFIG.LONG_FIXATION_MS) {
          pendingEvents.push({
            type: "long_fixation",
            wordIndex: idx,
            word: box.word,
            durationMs: step.dwell,
          });
          pendingEvents.push({
            type: "fixation",
            wordIndex: idx,
            word: box.word,
            durationMs: step.dwell,
          });
        }
      }
    }
    const t = window.setTimeout(scheduleNext, Math.max(120, step.dwell));
    timeouts.push(t);
  }

  return {
    status: () => (running ? "demo" : "idle"),
    async start() {
      running = true;
      startTime = performance.now();
      scriptIdx = 0;
      currentWordIdx = null;
      lastAdvancement = 0;
      scheduleNext();
    },
    stop() {
      running = false;
      timeouts.forEach((t) => clearTimeout(t));
      timeouts = [];
    },
    sample() {
      return lastSample;
    },
    setWordBoxes,
    flushEvents,
  };
}
