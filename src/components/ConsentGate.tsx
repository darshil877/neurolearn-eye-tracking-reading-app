import { useEffect, useState } from "react";
import type { Consent, Student } from "@/lib/db";
import * as db from "@/lib/db";
import { CONSENT_TEXT, CONSENT_TEXT_VERSION } from "@/lib/config";
import { Shield, CheckCircle2, UserCog } from "lucide-react";
import { useStore } from "@/lib/store";

interface Props {
  student: Student;
  onConsented: () => void;
}

/**
 * Shown before the camera ever starts. Records a timestamped consent row
 * in the DB (localStorage stand-in for Supabase) bound to the student and
 * the signed-in guardian. Cannot proceed until an explicit checkbox tick.
 */
export function ConsentGate({ student, onConsented }: Props) {
  const guardian = useStore((s) => s.guardian);
  const [checked, setChecked] = useState(false);
  const [existing, setExisting] = useState<Consent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    db.consents.forStudent(student.id).then(setExisting);
  }, [student.id]);

  async function handleConsent() {
    if (!guardian) {
      alert("Please sign in as a parent/teacher first.");
      return;
    }
    setSubmitting(true);
    await db.consents.record({
      student_id: student.id,
      guardian_id: guardian.id,
      guardian_email: guardian.email,
    });
    setSubmitting(false);
    onConsented();
  }

  if (existing) {
    return (
      <div className="max-w-3xl mx-auto rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Consent already on file</h2>
            <p className="mt-1 text-slate-600">
              You ({existing.guardian_email}) gave consent for <strong>{student.name}</strong> on{" "}
              {new Date(existing.consented_at).toLocaleString()}.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Consent version: {existing.consent_text_version || CONSENT_TEXT_VERSION}
            </p>
            <button
              onClick={onConsented}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-indigo-700"
            >
              Start reading session →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto rounded-3xl bg-white p-6 sm:p-8 shadow-lg ring-1 ring-slate-200">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
          <Shield className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <UserCog className="w-3 h-3" /> Adult consent required
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Before we start reading with {student.name}…
          </h2>
          <p className="mt-1 text-slate-600 text-sm">
            This is a prototype. Please read the following carefully and check the box to continue.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 p-5 text-[0.95rem] leading-relaxed text-slate-800 whitespace-pre-line ring-1 ring-amber-100">
        {CONSENT_TEXT}
      </div>

      <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="text-slate-700 text-[0.95rem]">
          I am <strong>{guardian?.name || "the responsible adult"}</strong>, I have read the above, and I give my
          permission for <strong>{student.name}</strong> to use NeuroLearn. I understand this app does{" "}
          <em>not</em> diagnose dyslexia or any other condition.
        </span>
      </label>

      <div className="mt-6 flex justify-end">
        <button
          disabled={!checked || submitting}
          onClick={handleConsent}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Recording consent…" : "I consent — start session"}
        </button>
      </div>
    </div>
  );
}
