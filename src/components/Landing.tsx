import { useState } from "react";
import { useStore } from "@/lib/store";
import { BookOpen, Eye, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { DEMO_MODE } from "@/lib/config";

export function Landing() {
  const signIn = useStore((s) => s.signIn);
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await signIn(email.trim(), name.trim());
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-indigo-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-amber-200/60 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-0 h-96 w-96 rounded-full bg-indigo-200/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <nav className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 font-extrabold text-slate-900">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl">NeuroLearn</span>
          </div>
          <div className="flex items-center gap-2">
            {DEMO_MODE && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                DEMO MODE
              </span>
            )}
            <button
              onClick={() => setShowSignIn(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            >
              Sign in
            </button>
          </div>
        </nav>

        {/* ---- About Dyslexia section (shown first so visitors learn what this is) ---- */}
        <section className="mt-12" id="about-dyslexia">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <BookOpen className="w-3.5 h-3.5" /> Learn the basics
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              What is dyslexia, really?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              A friendly, plain-language explainer for parents and teachers. Understanding the
              signs early is the first step toward getting a child the help they deserve.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon="💡"
              title="What it is"
              body={
                <>
                  <strong>Dyslexia</strong> is a common learning difference that mainly affects reading,
                  spelling, and word recognition, despite normal intelligence and good teaching. It is
                  <strong> neurobiological</strong> — the brain simply connects sounds to letters a bit
                  differently. It is <em>not</em> a sign of low intelligence or laziness. With the right
                  support, people with dyslexia learn and read successfully.
                </>
              }
            />
            <InfoCard
              icon="🧬"
              title="Root causes"
              body={
                <>
                  Researchers believe dyslexia is largely <strong>genetic</strong> and runs in families.
                  Brain-imaging studies show differences in the areas that handle phonological processing
                  (matching speech sounds to letters). It is not caused by bad eyesight, not hearing
                  properly, or a lack of effort. Early-life factors and environment can influence how it
                  shows up, but the underlying wiring is present from birth.
                </>
              }
            />
            <InfoCard
              icon="🔍"
              title="Common signs"
              body={
                <>
                  Signs can appear as early as preschool: delayed speech, trouble learning letters and
                  their sounds, difficulty rhyming, or mixing up similar words. In school, a child may
                  read slowly, guess at words, avoid reading aloud, reverse letters long after their
                  peers stop, or struggle with spelling. Reading is often tiring and frustrating even
                  when the child is clearly bright.
                </>
              }
            />
            <InfoCard
              icon="🧪"
              title="How it's detected"
              body={
                <>
                  Detection is a <strong>multi-step process</strong>. It starts with observation by
                  parents and teachers, then targeted screening (like the reading-pattern tracking in
                  this app), and finally a <strong>formal evaluation</strong> by a licensed psychologist
                  or educational specialist. A formal diagnosis uses standardized tests of reading,
                  spelling, phonological awareness, and cognitive ability. Screening tools flag{" "}
                  <em>who may benefit</em> from that full evaluation — they do not diagnose on their own.
                </>
              }
            />
          </div>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-900">How NeuroLearn fits in</h3>
            <p className="mt-2 text-slate-600 leading-relaxed">
              NeuroLearn is a <strong>screening-style companion</strong>, not a diagnostic tool. During a
              reading session it watches for patterns that commonly accompany early reading difficulty —
              frequent looking back at already-read words (regressions), long hesitant pauses on words,
              and slower-than-expected reading pace. When multiple patterns appear together, it flags the
              session for grown-ups to review and suggests a professional screening. It can also adapt the
              text in real time (bigger letters, friendlier font, warmer background) to make reading feel
              easier. Everything runs on-device, nothing is recorded or uploaded, and it never claims to
              provide a medical diagnosis.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2"><span className="text-base">✅</span> Flags patterns, doesn't label</span>
              <span className="inline-flex items-center gap-2"><span className="text-base">🔒</span> 100% on-device, private</span>
              <span className="inline-flex items-center gap-2"><span className="text-base">👨‍👩‍👧</span> Built for parents &amp; teachers</span>
              <span className="inline-flex items-center gap-2"><span className="text-base">🩺</span> Always follow up with a specialist</span>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-indigo-50 p-6 text-center ring-1 ring-indigo-100">
            <p className="text-slate-700 text-sm leading-relaxed">
              <strong>Important:</strong> This page is educational information only and is not a medical
              diagnosis. If you are concerned about a child's reading, please consult a qualified
              professional — early support makes a real difference.
            </p>
          </div>
        </section>

        {/* ---- Login / hero section (below the explainer) ---- */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <Workflow className="w-3.5 h-3.5" /> Prasunethon prototype • Not a medical device
            </div>
            <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold leading-tight text-slate-900">
              Reading help that{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
                watches quietly
              </span>{" "}
              and adapts in real time.
            </h1>
            <p className="mt-5 text-lg text-slate-700 leading-relaxed">
              NeuroLearn is a gamified English / Hindi / Tamil / Marathi reading app for primary-schoolers.
              When it notices hesitation (long pauses, looking back at words), it gently makes the
              text easier to read, and lets grown-ups know if a child might benefit from a reading
              specialist — without ever diagnosing, recording, or uploading anything.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowSignIn(true)}
                className="rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
              >
                I'm a teacher / parent →
              </button>
              <button
                onClick={async () => {
                  await signIn("demo@neurolearn.app", "Demo Teacher");
                }}
                className="rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Try with a demo account
              </button>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Feature icon={<Eye className="w-4 h-4" />} title="On-device eye tracking" copy="MediaPipe FaceMesh runs in your browser." />
              <Feature icon={<ShieldCheck className="w-4 h-4" />} title="Consent first" copy="The camera only turns on after an adult says yes." />
              <Feature icon={<BookOpen className="w-4 h-4" />} title="4 languages" copy="English, हिन्दी, தமிழ், मराठी — phonics included." />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 transform rotate-1">
              <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 p-5 font-opendyslexic text-xl leading-loose text-slate-800 warm-tint tint-3">
                <div className="mb-2 text-sm font-sans font-bold text-rose-700 font-opendyslexic">चिंकी की गेंद</div>
                चिंकी एक छोटी खरगोश है। उसकी एक लाल <span className="reading-word is-current">गेंद</span> है।
                गेंद पेड़ के नीचे लुढ़क गई। चिंकी दौड़ी और गेंद उठा लाई। वह बहुत खुश हुई।
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                  <Sparkles className="w-3 h-3" /> Adaptations on: easier font, warm tint, bigger letters
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-slate-900 px-4 py-3 text-xs text-white shadow-xl -rotate-2 max-w-[220px]">
              <div className="font-semibold">⚠️ Heuristic only</div>
              <div className="opacity-80">Flags patterns, doesn't diagnose. Always see a specialist for real concerns.</div>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-xs text-slate-500">
          Built at Prasunethon • All processing happens on your device • No video leaves your browser
        </footer>
      </div>

      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-slate-900">Sign in</h3>
            <p className="mt-1 text-sm text-slate-500">
              Only parents and teachers sign in. Kids never need accounts.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.in"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <p className="text-[11px] text-slate-400">
                {DEMO_MODE
                  ? "Demo mode: any email works, no network needed."
                  : "In production this uses Supabase Auth; for the demo we create a local session."}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSignIn(false)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Feature({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-white/70 p-3 ring-1 ring-slate-200/60 backdrop-blur">
      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-slate-500 text-xs leading-snug">{copy}</div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {icon}
        </span>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
