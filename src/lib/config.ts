// Tunable heuristic thresholds — tweak live during judging if needed.
// NOTE: These are NOT clinically validated numbers; they are prototype
// heuristics tuned for the hackathon demo. The app flags patterns
// suggestive of dyslexia-like reading difficulty, it does not diagnose.
export const GAZE_CONFIG = {
  // A "fixation" = gaze dwell within ~1 word box for this long
  FIXATION_THRESHOLD_MS: 400,
  // "Long fixation" = potential hesitation
  LONG_FIXATION_MS: 400,
  // Regression rate threshold (regressions / total saccades) above which
  // we consider the session "flagged for review"
  REGRESSION_RATE_THRESHOLD: 0.3,
  // Rolling window of samples we keep for smoothing
  ROLLING_WINDOW_SIZE: 12,
  // How many consecutive "hesitation" samples before adaptations kick in
  HESITATION_TRIGGER_COUNT: 6,
  // Minimum saccades before we even look at regression rate
  MIN_SACCADES_FOR_FLAG: 8,
  // Gaze-to-word mapping: how close (fraction of word width) counts as "on" the word
  WORD_HIT_RADIUS: 0.6,
};

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "mr", label: "मराठी (Marathi)", flag: "🇮🇳" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export const CONSENT_TEXT_VERSION = "v1.0-prasunethon";

export const CONSENT_TEXT = `This app watches how your child reads to make the text easier for them in real time (bigger letters, special font, warm reading tint) and lets you know if they might benefit from a visit to a reading specialist.

This is a PRASUNETHON PROTOTYPE — it does NOT diagnose dyslexia or any other condition.

Video from the camera is processed entirely on this device. No video, no face images, and no biometric raw data are ever uploaded or stored. We only save anonymous reading-pattern numbers (like "looked back at a word a lot") that you can delete any time.

By checking this box, you are the responsible adult (parent/teacher) and you give permission for your child to use this reading app.`;

// DEMO_MODE: set at build time via import.meta.env.VITE_DEMO_MODE.
// When true, we replay a scripted gaze sequence instead of using the camera.
export const DEMO_MODE: boolean =
  (import.meta as any).env?.VITE_DEMO_MODE === "true" ||
  new URLSearchParams(window.location.search).has("demo");
