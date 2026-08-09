# NeuroLearn — Prasunethon Prototype

**Live Demo:** [NeuroLearn WebCraft Studio](https://neurolearn-eye-tracking-reading-app.webcraftstudio.workers.dev/)
*(Note: We highly recommend appending `?demo` to the URL for judging environments with unpredictable lighting).*

NeuroLearn is a gamified reading app for primary-schoolers, now supporting **English, Hindi, Tamil, and Marathi**. It uses on-device eye tracking (MediaPipe FaceMesh) to spot hesitation patterns (long fixations, regressions) and quietly adapts the text in real-time (OpenDyslexic font, looser spacing, warm tint, word-by-word highlight). After the story, it serves a short phonics mini-game focused specifically on the words the child hesitated on.

> ⚠️ **This is a hackathon prototype, NOT a medical device.** It does not diagnose dyslexia. It flags reading patterns that *may* warrant a specialist screening. Every screen, metric, and dashboard label strictly reflects this.

---

## 📌 Table of Contents

1. [Understanding Dyslexia](#-understanding-dyslexia--the-problem-were-solving)
2. [Why NeuroLearn Is Needed](#-why-neurolearn-is-needed)
3. [How NeuroLearn Works](#-how-neurolearn-works)
4. [The Science Behind the Eye Tracking](#-the-science-behind-eye-tracking-based-detection)
5. [Aligning with Government of India Initiatives](#-aligning-with-government-of-india-initiatives)
6. [Why This Stands Out](#-why-this-stands-out-the-wow-factor)
7. [Tech Stack](#-tech-stack)
8. [Running It Locally](#-running-it-locally)
9. [Environment Variables](#environment-variables)
10. [Demo Mode](#-demo_mode-crucial-for-judging)
11. [Live-Tunable Thresholds](#️-live-tunable-thresholds)
12. [Privacy & Consent Flow](#-privacy--consent-flow)
13. [Roadmap](#️-roadmap--whats-next)
14. [References](#-references--further-reading)

---

## 🧠 Understanding Dyslexia — The Problem We're Solving

### What is dyslexia?

Dyslexia is a neurodevelopmental, language-based learning difficulty. Children with dyslexia are just as intelligent as their peers, but their brains process the sounds of language and connect them to written letters differently, which makes decoding text slow and effortful even after normal instruction. It is not a vision problem, and it is not caused by low motivation or poor parenting — it is a difference in how the brain processes written language.

### What causes it

- **Neurobiological wiring** — differences in how the brain's language-processing regions (particularly areas handling phonological processing) connect and activate during reading.
- **Genetics** — dyslexia runs strongly in families; heritability studies put the genetic contribution at roughly 50–60%, and researchers have linked candidate genes to several chromosomal regions.
- **Environment interacts with, but doesn't cause, dyslexia** — inconsistent early literacy exposure can mask or worsen reading difficulty, but the underlying difference is neurological, not a result of upbringing.

### Common symptoms

- Slow, effortful, or inaccurate word reading despite adequate instruction and intelligence
- Difficulty sounding out unfamiliar words (poor phonological decoding)
- Frequent regressions — the eyes jumping back to re-read words or lines
- Letter/word reversals or confusion, weak spelling despite practice
- Reading comprehension that lags behind listening comprehension
- Avoidance of reading aloud, fatigue, or anxiety around reading tasks

### How it's diagnosed today — and why that's a bottleneck

The gold-standard route is a **formal psycho-educational assessment** by a clinical/educational psychologist — standardized reading, spelling, and cognitive tests, usually taking multiple sessions. In India, this is layered on top of a legal requirement: the **Rights of Persons with Disabilities (RPwD) Act, 2016** recognizes dyslexia as a Specific Learning Disability (SLD) and mandates that every school-going child be screened for SLD by Class III or age eight, whichever comes first.

The problem is capacity, not intent. Estimates from the Dyslexia Association of India put dyslexia prevalence at roughly 10–15% of Indian schoolchildren — tens of millions of children — against a very small pool of qualified educational psychologists and special educators, most concentrated in metro cities. Screening tools also need to exist in a child's own language to be valid, and most standardized batteries were built for English or a handful of Indian languages. The result: a legally mandated screening step that is inconsistently implemented, with long waitlists, high private-assessment costs, and children in regional-language and rural schools left out almost entirely.

---

## ❓ Why NeuroLearn Is Needed

Put simply: **India has a law that says every child should be screened for reading difficulty by age eight, and not nearly enough capacity to do it.** NeuroLearn is built to sit in that gap — not to replace a clinical diagnosis, but to make the *first, hardest step* (noticing that a child is struggling and deciding whether to refer them) cheap, fast, language-inclusive, and available anywhere there's a phone or laptop camera.

Specifically, NeuroLearn addresses:

- **Specialist scarcity** — a browser tab replaces the need for a psychologist to be in the room for the first pass.
- **Cost** — private dyslexia assessments in India commonly run into thousands of rupees; NeuroLearn is free to run, client-side, on hardware schools already have.
- **Language exclusion** — most validated screening tools exist in only a few Indian languages; NeuroLearn already supports English, Hindi, Tamil, and Marathi, with the architecture built to add more.
- **Awareness and stigma** — framing the experience as a *game*, not a *test*, lowers the anxiety and social stigma that keeps struggling readers from being flagged in the first place.
- **Data that's currently invisible** — teachers see the outcome (a child who "doesn't like reading") but rarely the underlying pattern (specific words, specific hesitation types). NeuroLearn surfaces that pattern automatically, every time the child reads.

---

## 👁️ How NeuroLearn Works

1. **Consent first.** A parent or teacher signs in, reviews a plain-language explanation of what the app does, and explicitly checks a consent box before any camera access is requested.
2. **The child reads a story.** MediaPipe FaceMesh tracks iris landmarks (points 468–477) client-side, in the browser, via WASM — entirely on-device, with a GPU-to-CPU fallback for older hardware.
3. **Gaze becomes signal.** As the child reads, NeuroLearn measures fixation duration and regression rate against configurable thresholds (see [Live-Tunable Thresholds](#️-live-tunable-thresholds)) to flag words where the child hesitated or re-read.
4. **The reading experience adapts quietly, in real time** — OpenDyslexic font, looser letter/line spacing, a warm background tint, and word-by-word highlighting kick in progressively as hesitation signals accumulate, without ever interrupting the story or telling the child they "got something wrong."
5. **A phonics mini-game follows**, built specifically around the words the child hesitated on — turning the flagged struggle points into targeted practice instead of a red mark on a test.
6. **A dashboard trend, not a diagnosis, is produced** for the parent/teacher — a pattern over multiple sessions that can support a decision to seek a specialist screening, worded carefully to never claim a diagnosis.

No video frame ever leaves the device — all inference happens client-side, which also means the tool works in schools with poor or no internet once assets are cached.

---

## 🔬 The Science Behind Eye-Tracking-Based Detection

NeuroLearn's core bet — that hesitation patterns in eye movement correlate with dyslexia risk — is not a hackathon guess; it's an active academic research area. Peer-reviewed studies applying machine learning to eye-tracking data during reading have repeatedly found that dyslexic and typical readers separate cleanly on features like fixation duration and regression frequency, with reported classification accuracies ranging from roughly 80% up to the mid-90s percent depending on the dataset, sensor, and model used. The consistent underlying finding across this literature: dyslexic readers show measurably longer fixations and more frequent regressions than typical readers, which is exactly the signal NeuroLearn's `LONG_FIXATION_MS` and `REGRESSION_RATE_THRESHOLD` constants are designed to catch.

This is also precisely why the README opens with a disclaimer: research-grade accuracy figures come from controlled studies with dedicated eye-tracking hardware and clinically confirmed cohorts. NeuroLearn uses a consumer webcam and a browser — a deliberate trade of some precision for radical accessibility. It's a **triage signal**, not a lab result.

---

## 🏛️ Aligning with Government of India Initiatives

NeuroLearn isn't proposing a parallel system to what the Government of India already runs — it's designed to slot into gaps in schemes that already exist, as a low-cost digital front end for legal mandates and missions that currently lack tooling at scale. This is speculative/roadmap framing (no formal government pilot or approval exists yet), but every scheme referenced below is real and currently active.

| Scheme / Law | What it already mandates | Where NeuroLearn fits |
|---|---|---|
| **RPwD Act, 2016** | Universal SLD screening for every child by Class III / age 8; resource rooms and remedial education in schools | NeuroLearn can act as the **first-pass digital screening layer** schools use to meet the mandate, generating a shortlist for the resource teacher instead of relying on manual, teacher-administered checklists |
| **Samagra Shiksha — Inclusive Education for CwSN** | Funds assistive devices, teaching-learning materials (TLMs), and resource rooms for children with special needs | NeuroLearn's adaptive reading mode and phonics engine could be positioned as a **zero-cost digital TLM**, distributed through the same channels that already supply assistive material to schools |
| **NIPUN Bharat (FLN Mission)** | A time-bound national push for every child to read with comprehension by the end of Grade 3, with reading-fluency benchmarks tracked across 20+ languages | NeuroLearn's per-word hesitation data is a natural **formative input** for FLN progress tracking — it shows *which* words and phonics patterns are blocking a specific child, not just a pass/fail benchmark score |
| **Rashtriya Bal Swasthya Karyakram (RBSK)** | Mobile Health Teams screen every child aged 0–18 for the "4 Ds" (including developmental delays) and refer them to District Early Intervention Centres (DEICs) | A tablet running NeuroLearn could give MHTs and ASHA workers a **five-minute reading-hesitation check** to add to their existing screening kit before a DEIC referral, at negligible marginal cost |
| **DST-funded regional-language dyslexia tools (e.g., the JST/MST screening batteries)** | The Department of Science & Technology has already funded and validated teacher-administered dyslexia screening tools in multiple Indian languages, tested across thousands of children in several cities | This is direct precedent that the government already invests in exactly this problem class. NeuroLearn extends that same goal — regional-language, teacher-friendly screening — into an **automated, camera-based, self-scoring format** that removes the need for a trained administrator to run and score the test by hand |

**Illustrative scenario:** picture a government-aided school in a Tier-3 town, already receiving Samagra Shiksha funding for its resource room. During the weekly library period, the class teacher runs NeuroLearn's Hindi story mode on the school's shared tablets — no extra staff, no extra budget line. By the end of the month, the dashboard has quietly surfaced four children with a consistent hesitation pattern on the same class of words. Those four names go into the resource teacher's queue for the RPwD-mandated screening that was always supposed to happen at age eight — except now it's backed by weeks of real reading data instead of a single classroom observation. That's the gap NeuroLearn is built to close.

---

## 🏆 Why This Stands Out (The "Wow" Factor)

* **Zero Server-Side Video Processing:** 100% of the eye tracking is computed client-side in the browser using WASM. No video frames ever leave the device.
* **Smart Adaptations:** The UI reacts seamlessly to the user's struggle without interrupting their flow, reducing reading anxiety.
* **Failsafe Engineering:** Includes a robust GPU-to-CPU delegate fallback for older devices and a fully scripted "Demo Mode" for flawless stage presentations.
* **Grounded in real research and real policy** — not just a clever demo, but a design that maps directly onto a legal screening mandate India already has and currently struggles to fulfil at scale.

---

## 💻 Tech Stack

- **Frontend:** React 19 + Vite, Tailwind CSS, installable as a PWA.
- **Eye tracking:** `@mediapipe/tasks-vision` (v1.0.1 WASM). Iris landmarks 468–477 are used for pupil position. **Fully client-side** with intelligent GPU-to-CPU fallback. No Python, no OpenCV, no server round-trips for tracking.
- **Data layer:** Designed for Supabase (Postgres + Auth + Storage), but currently utilizing a `localStorage`-backed drop-in schema (`src/lib/db.ts`) so the entire prototype evaluates instantly with zero backend setup.
- **LLM content generation:** The phonics generator is stubbed (`src/lib/phonics.ts`) with hand-authored question banks across all supported languages. Production ready to proxy Gemini/Claude via Supabase Edge Functions.
- **Adaptive font:** OpenDyslexic loaded dynamically.

## 🚀 Running It Locally

```bash
# from /app
npm install
npm run dev          # http://localhost:5173
npm run build        # single-file bundle in dist/index.html
```

### Environment Variables

| Var | Purpose | Default |
|---|---|---|
| `VITE_DEMO_MODE` | If true, skip the camera and replay a scripted reading sequence with realistic hesitation / regressions. Always works even on stage without good lighting / wifi. | `false` |
| `VITE_SUPABASE_URL` | (Production) Supabase project URL. | unused |
| `VITE_SUPABASE_ANON_KEY` | (Production) Supabase anon key. | unused |

## 🎭 DEMO_MODE (Crucial for Judging)

This is a first-class, reliable path — we expect live lighting/cameras to be flaky on stage. You can activate this locally via `.env` or on the live site by appending `?demo` to the URL.

In demo mode:

- No camera permission is requested.
- The tracker replays a scripted gaze path with intentional long fixations and regressions on certain words (see `DEMO_SCRIPT` in `src/lib/gaze/tracker.ts`).
- The gaze cursor moves, hesitation counters ramp up, and adaptations (font → spacing → tint → highlight) kick in automatically at live thresholds.
- A full phonics game and dashboard trend are produced.

## ⚙️ Live-Tunable Thresholds

All numbers are in `src/lib/config.ts` so they can be tuned live on stage:

| Constant | Default | Meaning |
|---|---|---|
| `FIXATION_THRESHOLD_MS` | 400 | Dwell time needed to register a fixation. |
| `LONG_FIXATION_MS` | 400 | Dwell time that counts as a hesitation. |
| `REGRESSION_RATE_THRESHOLD` | 0.30 | Regressions / saccades above this → flagged. |
| `MIN_SACCADES_FOR_FLAG` | 8 | Don't flag on a tiny amount of reading. |
| `HESITATION_TRIGGER_COUNT` | 6 | Number of hesitancy signals between each adaptation ramp. |
| `WORD_HIT_RADIUS` | 0.6 | Normalized distance from word center that still counts as "on" the word. |

## 🔒 Privacy & Consent Flow

- Only adults (parent/teacher) sign in.
- Before a session starts, guardians see a plain-language panel explaining the process, emphasizing that video is processed on-device and never uploaded.
- An explicit checkbox is required to record a consents row in the database.
- The camera is never started before consent is recorded.
- A persistent "Privacy info" button remains available during the reading flow.
- Because no video or biometric data ever leaves the device, NeuroLearn's data footprint is designed to sit comfortably within India's Digital Personal Data Protection (DPDP) Act, 2023 framework for children's data — there is, by design, very little to protect because almost nothing is transmitted or stored centrally.

## 🗺️ Roadmap — What's Next

- Expand language coverage beyond English, Hindi, Tamil, and Marathi toward the full set of languages NIPUN Bharat already benchmarks reading fluency in.
- Offline-first PWA caching so schools with intermittent connectivity can run full sessions with zero live internet dependency.
- Teacher/administrator export formats designed to slot into existing school data systems (e.g., UDISE+-style reporting) rather than creating a new silo.
- Formal validation study comparing NeuroLearn's hesitation signal against a clinically administered screening battery, as a prerequisite for any real integration with a government pilot.
- Optional low-bandwidth SMS/WhatsApp summary for parents without smartphones.

## 📚 References & Further Reading

- [Eye tracking based dyslexia detection using a holistic approach — Scientific Reports](https://www.nature.com/articles/s41598-021-95275-1)
- [Accessible Dyslexia Detection with Real-Time Reading Feedback through Robust Interpretable Eye-Tracking Features — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10046816/)
- [Developing a Dyslexia Indicator Using Eye Tracking — arXiv](https://arxiv.org/abs/2506.11004)
- [Specific Learning Disabilities in India: Current Situation and the Path Ahead — Indian Pediatrics](https://link.springer.com/article/10.1007/s13312-022-2515-4)
- [Specific Learning Disability under the RPWD Act, 2016 — WeCapable](https://wecapable.com/specific-learning-disability-definition-examples-types/)
- [Samagra Shiksha — Inclusive Education for CwSN (PIB)](https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1982426&reg=3&lang=2)
- [NIPUN Bharat Mission — Ministry of Education](https://nipunbharat.education.gov.in/fls/fls.aspx)
- [Rashtriya Bal Swasthya Karyakram (RBSK) — National Health Mission](https://nhm.gov.in/index4.php?lang=1&level=0&linkid=499&lid=773)
- [Decoding dyslexia: policy, practice, and awareness in India — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12077634/)
- [DST-funded regional-language dyslexia screening tools (JST/MST) — PIB](https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=128722)