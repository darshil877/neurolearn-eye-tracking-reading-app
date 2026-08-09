# NeuroLearn — Prasunethon prototype

A gamified vernacular (Hindi / Tamil / Marathi) reading app for primary-schoolers.
It uses on-device eye tracking (MediaPipe FaceMesh) to spot hesitation patterns
(long fixations, regressions) and quietly adapts the text (OpenDyslexic font,
looser spacing, warm tint, word-by-word highlight). After the story it serves a
short phonics mini-game focused on the words the child hesitated on.

> ⚠️ **This is a hackathon prototype, NOT a medical device.** It does not diagnose
> dyslexia. It flags reading patterns that *may* warrant a specialist screening.
> Every screen, every metric and every email/dashboard label reflects this.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS, installs as an installable PWA
  (single-file build via `vite-plugin-singlefile` for the demo).
- **Eye tracking:** `@mediapipe/tasks-vision` (FaceMesh, WASM, **fully client
  side**). Iris landmarks 468–477 are used for pupil position. No Python, no
  OpenCV, no server round-trips for tracking.
- **Data layer:** the real product uses Supabase (Postgres + Auth + Storage).
  For the single-file offline demo we ship a `localStorage`-backed drop-in that
  matches the Supabase schema (see `src/lib/db.ts`) so the entire prototype
  works with zero backend setup. Swap in `@supabase/supabase-js` by implementing
  the same functions.
- **LLM content generation:** the phonics generator is stubbed
  (`src/lib/phonics.ts`) with hand-authored question banks for all three
  languages. In production this calls a Supabase Edge Function (`generate-story`
  / `translate-content`) which proxies to Gemini/Claude with the key hidden
  server-side, and caches results in `stories` / a generation cache table.
- **Adaptive font:** OpenDyslexic loaded as a web font from CDN Fonts
  (self-hosting recommended for production — see
  `src/components/OpenDyslexic.css`).

## Project layout

```
/neurolearn
  /app
    /src
      /components
        AdaptiveText.tsx       # Renders story as measured word spans; applies adaptations
        ConsentGate.tsx        # Adult consent gate (blocks camera until consent recorded)
        GazeTracker.tsx        # MediaPipe + demo tracker + gaze dot + privacy chip
        Landing.tsx            # Pre-signin marketing + sign-in
        PhonicsGame.tsx        # Post-reading multiple-choice phonics game
        StoryReader.tsx        # Reading flow: intro → reading → phonics → summary
        TeacherDashboard.tsx   # Student list, trend charts, "flagged for review"
        OpenDyslexic.css       # Adaptive styles + warm-tint + word highlight
      /lib
        config.ts              # All thresholds as constants, DEMO_MODE, consent text
        db.ts                  # localStorage-backed store (drop-in for Supabase)
        gaze/tracker.ts        # Live MediaPipe tracker + simulated demo tracker
        phonics.ts             # Placeholder LLM-driven phonics generator
        store.ts               # Zustand app state
      App.tsx
      main.tsx
  /supabase                    # Referenced in design but not needed for demo
    /functions/generate-story
    /migrations
  /docs
    README.md                  # this file
```

## Running it

```bash
# from /app
npm install
npm run dev          # http://localhost:5173
npm run build        # single-file bundle in dist/index.html
npm run preview
```

### Env vars

| Var | Purpose | Default |
|-----|---------|---------|
| `VITE_DEMO_MODE` | If `true`, skip the camera and replay a scripted reading sequence with realistic hesitation / regressions. **Always works even on stage without good lighting / wifi.** | `false` |
| `VITE_SUPABASE_URL` | (Production) Supabase project URL. | unused (local store) |
| `VITE_SUPABASE_ANON_KEY` | (Production) Supabase anon key. | unused (local store) |

You can also add `?demo` to the URL to force demo mode without rebuilding.

## DEMO_MODE

This is a **first-class, reliable path** — we expect live lighting/cameras to be
flaky on stage. In demo mode:

1. No camera permission is requested.
2. The tracker replays a scripted gaze path with intentional long fixations and
   regressions on certain words (see `DEMO_SCRIPT` in `src/lib/gaze/tracker.ts`).
3. The gaze cursor still moves, the hesitation counter still ramps, and
   adaptations (font → spacing → tint → word highlight) kick in automatically at
   the same thresholds as live mode.
4. A full phonics game and dashboard trend are still produced.

We recommend demoing in DEMO_MODE for judging unless you have a controlled
lighting setup and a known-good device.

## Thresholds — live-tunable

All numbers are in `src/lib/config.ts` so you can tune them live on stage:

| Constant | Default | Meaning |
|----------|---------|---------|
| `FIXATION_THRESHOLD_MS` | 400 | Dwell time needed to register a fixation. |
| `LONG_FIXATION_MS` | 400 | Dwell time that counts as a hesitation. |
| `REGRESSION_RATE_THRESHOLD` | 0.30 | regressions / saccades above this → flagged. |
| `MIN_SACCADES_FOR_FLAG` | 8 | Don't flag on a tiny amount of reading. |
| `HESITATION_TRIGGER_COUNT` | 6 | Number of hesitancy signals between each adaptation ramp. |
| `WORD_HIT_RADIUS` | 0.6 | Normalized distance from word center that still counts as "on" the word. |

A session is **flagged** if `regression_rate > 30%` **AND**
`avg_fixation_ms > 400ms`. Flagged sessions surface in the teacher dashboard
with the label *"may benefit from reading specialist screening"* — never
"has dyslexia".

## Consent flow

1. Only adults (parent/teacher) sign in.
2. Before a child's session can start, the guardian sees a plain-language panel
   explaining what happens, that it's not a diagnosis, and that video is
   processed on-device and never uploaded.
3. An explicit checkbox is required. When ticked, a `consents` row is written
   with `guardian_id`, `student_id`, `consented_at`, and
   `consent_text_version`.
4. The camera is *never* started before consent is recorded (see
   `ConsentGate` → `StoryReader`; `GazeTracker` only receives `running=true`
   after the gate).
5. A persistent "Privacy info" button in the top-right during reading opens a
   modal re-stating what the app is (and is not) doing.

## What's working end-to-end

- Landing + adult sign-in (any email works in the local demo).
- Adding a student (name / grade / language).
- Consent gate (timestamped, versioned, blocks camera until given).
- Full Hindi story rendered as word spans with measurable bounding boxes.
- DEMO_MODE: fully scripted hesitation sequence, adaptations ramp up live, gaze
  cursor visible, phonics game appears, session appears in the teacher
  dashboard.
- Live camera mode (`VITE_DEMO_MODE=false`): MediaPipe FaceMesh initializes,
  irises extracted, gaze dot follows your eyes, fixations/regressions logged to
  console + UI, adaptations kick in when the heuristic fires.
- Four independent adaptations: OpenDyslexic font, line/word/letter spacing,
  warm-tint gradient overlay, word-by-word highlight of the current word under
  gaze. All four toggle individually through the adaptation level 0 → 4.
- Phonics game post-reading, targeting the words that were struggled with.
- Teacher dashboard: student list, regression-rate trend line per student,
  top struggled words, "flagged for review" badge, recommendation copy that
  explicitly says it is not a diagnosis.
- Seeded demo data so the dashboard has a flagged session visible on first
  login.

## What is stubbed / would need real work before a classroom

1. **Supabase backend** — the `db.ts` file has the right shape but uses
   localStorage. Real deploy would swap in `@supabase/supabase-js` and add RLS
   policies: guardians can only see their own students/sessions.
2. **Edge functions** (`generate-story`, `translate-content`) — phonics content
   is hand-authored. Wiring up Gemini/Claude server-side with proper caching
   (story hash + language as cache key) is a straightforward next step.
3. **Gaze calibration** — the current mapping is a rough iris-displacement
   heuristic. For real use, a 5-point calibration routine per child would
   tighten hit-testing considerably.
4. **Clinical validation** — the thresholds are engineering guesses tuned so
   the demo works reliably. A real product would co-design thresholds with
   special-education researchers and run an IRB-approved study.
5. **PWA install manifest / service worker** — `vite-plugin-pwa` would add
   offline install; the current build is already single-file and works offline
   by nature.
6. **Audio / pronunciation** — the spec mentions phonics exercises. TTS of
   target words would help pre-readers.
7. **Multi-student classroom flows** — CSV/class roster import, per-class
   reports, specialist referral hand-off.
8. **Actual storage of video is explicitly NOT performed** — the current code
   never captures or uploads frames; the consent text says as much. We'd want
   a privacy audit + age-gating before any real deployment.

## Key safety properties

- Consent is **required** before any sensor is activated.
- No face imagery or raw landmarks are ever sent anywhere.
- Every place the hesitation score surfaces uses *"flagged for review"* /
  *"may benefit from screening"* language.
- The adaptations are designed to be *unobtrusive* — no pop-ups, no "let's
  test you!" framing, the child just sees a friendly reading game.
