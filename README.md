Markdown
# NeuroLearn — Prasunethon Prototype

**Live Demo:** [NeuroLearn WebCraft Studio](https://neurolearn-eye-tracking-reading-app.webcraftstudio.workers.dev/) 
*(Note: We highly recommend appending `?demo` to the URL for judging environments with unpredictable lighting).*

NeuroLearn is a gamified reading app for primary-schoolers, now supporting **English, Hindi, Tamil, and Marathi**. 
It uses on-device eye tracking (MediaPipe FaceMesh) to spot hesitation patterns (long fixations, regressions) and quietly adapts the text in real-time (OpenDyslexic font, looser spacing, warm tint, word-by-word highlight). After the story, it serves a short phonics mini-game focused specifically on the words the child hesitated on.

> ⚠️ **This is a hackathon prototype, NOT a medical device.** It does not diagnose dyslexia. It flags reading patterns that *may* warrant a specialist screening. Every screen, metric, and dashboard label strictly reflects this.

## 🏆 Why this stands out (The "Wow" Factor)
* **Zero Server-Side Video Processing:** 100% of the eye tracking is computed client-side in the browser using WASM. No video frames ever leave the device.
* **Smart Adaptations:** The UI reacts seamlessly to the user's struggle without interrupting their flow, reducing reading anxiety.
* **Failsafe Engineering:** Includes a robust GPU-to-CPU delegate fallback for older devices and a fully scripted "Demo Mode" for flawless stage presentations.

## 💻 Tech Stack

- **Frontend:** React 19 + Vite, Tailwind CSS, installable as a PWA.
- **Eye tracking:** `@mediapipe/tasks-vision` (v1.0.1 WASM). Iris landmarks 468–477 are used for pupil position. **Fully client-side** with intelligent GPU-to-CPU fallback. No Python, no OpenCV, no server round-trips for tracking.
- **Data layer:** Designed for Supabase (Postgres + Auth + Storage), but currently utilizing a `localStorage`-backed drop-in schema (`src/lib/db.ts`) so the entire prototype evaluates instantly with zero backend setup.
- **LLM content generation:** The phonics generator is stubbed (`src/lib/phonics.ts`) with hand-authored question banks across all supported languages. Production ready to proxy Gemini/Claude via Supabase Edge Functions.
- **Adaptive font:** OpenDyslexic loaded dynamically.

## 🚀 Running it Locally

```bash
# from /app
npm install
npm run dev          # http://localhost:5173
npm run build        # single-file bundle in dist/index.html
Environment Variables
Var	Purpose	Default
VITE_DEMO_MODE	
If true, skip the camera and replay a scripted reading sequence with realistic hesitation / regressions. Always works even on stage without good lighting / wifi.

  
MD

false

  
MD

VITE_SUPABASE_URL	
(Production) Supabase project URL.  
MD

unused  
MD

VITE_SUPABASE_ANON_KEY	
(Production) Supabase anon key.  
MD

unused  
MD

🎭 DEMO_MODE (Crucial for Judging)
This is a first-class, reliable path — we expect live lighting/cameras to be flaky on stage. You can activate this locally via .env or on the live site by appending ?demo to the URL.  
MD
+ 1

In demo mode:

No camera permission is requested.  
MD

The tracker replays a scripted gaze path with intentional long fixations and regressions on certain words (see DEMO_SCRIPT in src/lib/gaze/tracker.ts).  
MD

The gaze cursor moves, hesitation counters ramp up, and adaptations (font → spacing → tint → highlight) kick in automatically at live thresholds.  
MD

A full phonics game and dashboard trend are produced[cite: 1].

⚙️ Live-Tunable Thresholds
All numbers are in src/lib/config.ts so they can be tuned live on stage[cite: 1]:

Constant	Default	Meaning
FIXATION_THRESHOLD_MS	400	
Dwell time needed to register a fixation[cite: 1].

LONG_FIXATION_MS	400	
Dwell time that counts as a hesitation[cite: 1].

REGRESSION_RATE_THRESHOLD	0.30	
Regressions / saccades above this → flagged[cite: 1].

MIN_SACCADES_FOR_FLAG	8	
Don't flag on a tiny amount of reading[cite: 1].

HESITATION_TRIGGER_COUNT	6	
Number of hesitancy signals between each adaptation ramp[cite: 1].

WORD_HIT_RADIUS	0.6	
Normalized distance from word center that still counts as "on" the word[cite: 1].

🔒 Privacy & Consent Flow
Only adults (parent/teacher) sign in[cite: 1].

Before a session starts, guardians see a plain-language panel explaining the process, emphasizing that video is processed on-device and never uploaded[cite: 1].

An explicit checkbox is required to record a consents row in the database[cite: 1].

The camera is never started before consent is recorded[cite: 1].

A persistent "Privacy info" button remains available during the reading flow[cite: 1].