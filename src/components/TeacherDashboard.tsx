import { useEffect, useMemo, useState } from "react";
import * as db from "@/lib/db";
import type { Session, Student } from "@/lib/db";
import { useStore } from "@/lib/store";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Users,
  LogOut,
  Sparkles,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

export function TeacherDashboard() {
  const guardian = useStore((s) => s.guardian);
  const signOut = useStore((s) => s.signOut);
  const navigate = useStore((s) => s.navigate);

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);

  async function loadAll() {
    if (!guardian) return;
    const stu = await db.students.list(guardian.id);
    setStudents(stu);
    const sess = await db.sessions.listAll(guardian.id);
    setSessions(sess);
    if (stu.length === 0) setShowAddStudent(true);
  }

  useEffect(() => {
    loadAll();
  }, [guardian?.id]);

  const flaggedCount = sessions.filter((s) => s.flagged).length;
  const totalReaders = students.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-4 h-4" /> NeuroLearn Teacher Dashboard
          </div>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Welcome back, {guardian?.name}
          </h1>
          <p className="text-slate-500 text-sm">
            This dashboard shows reading-pattern trends across your students. It does NOT diagnose dyslexia —
            only flags children who may benefit from a specialist screening.
          </p>
        </div>
        <button
          onClick={() => {
            signOut();
            navigate({ name: "landing" });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Students"
          value={totalReaders.toString()}
          color="indigo"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Reading sessions"
          value={sessions.length.toString()}
          color="emerald"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Flagged for review"
          value={flaggedCount.toString()}
          color="amber"
          sub="may benefit from screening"
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Students</h2>
        <button
          onClick={() => setShowAddStudent(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4" /> Add student
        </button>
      </div>

      {students.length === 0 ? (
        <EmptyState onAdd={() => setShowAddStudent(true)} />
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              sessions={sessions.filter((x) => x.student_id === s.id)}
              onStart={() => {
                useStore.getState().setStudent(s);
                navigate({ name: "consent", params: { studentId: s.id } });
              }}
            />
          ))}
        </div>
      )}

      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onCreated={() => {
            setShowAddStudent(false);
            loadAll();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "indigo" | "emerald" | "amber";
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
          {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function StudentCard({
  student,
  sessions,
  onStart,
}: {
  student: Student;
  sessions: Session[];
  onStart: () => void;
}) {
  const chartData = useMemo(() => {
    return [...sessions]
      .sort((a, b) => +new Date(a.started_at) - +new Date(b.started_at))
      .map((s, i) => ({
        idx: i + 1,
        regressionRate: Math.round(s.regression_rate * 100),
        avgFixation: Math.round(s.avg_fixation_ms),
        flagged: s.flagged,
      }));
  }, [sessions]);

  const anyFlagged = sessions.some((s) => s.flagged);
  const struggledWords = useMemo(() => {
    const m = new Map<string, number>();
    sessions.forEach((s) => s.struggled_words.forEach((w) => m.set(w, (m.get(w) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sessions]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
          <div className="text-xs text-slate-500">
            Grade {student.grade} • {student.language.toUpperCase()}
          </div>
        </div>
        {anyFlagged ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <AlertTriangle className="w-3 h-3" /> Flagged for review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> On track
          </span>
        )}
      </div>

      <div className="mt-4 h-32 -mx-2">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No sessions yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: -20 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} domain={[0, 80]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v, name) => {
                  const num = Number(v);
                  if (name === "regressionRate") return [`${num}% regressions`, "Regression rate"];
                  return [`${num}ms avg fixation`, "Avg fixation"];
                }}
              />
              <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "flag", fontSize: 10, fill: "#b45309", position: "insideTopRight" }} />
              <Line type="monotone" dataKey="regressionRate" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {struggledWords.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <TrendingUp className="w-3 h-3" /> Words revisited most often
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {struggledWords.map(([w, c]) => (
              <span key={w} className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100 font-opendyslexic">
                {w} <span className="text-rose-400">×{c}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onStart}
          className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          Start reading session →
        </button>
      </div>

      {anyFlagged && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[11.5px] leading-snug text-amber-900 ring-1 ring-amber-200">
          <strong>Recommendation:</strong> Based on elevated regression rate and long fixations across sessions,
          consider referring {student.name} for a formal reading-specialist screening. <em>This is not a diagnosis.</em>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Users className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-3 text-lg font-bold text-slate-800">Add your first reader</h3>
      <p className="mt-1 text-sm text-slate-500">
        You'll need to give consent on behalf of each child before any camera turns on.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-indigo-700"
      >
        <UserPlus className="w-4 h-4" /> Add a student
      </button>
    </div>
  );
}

function AddStudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const guardian = useStore((s) => s.guardian);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("1");
  const [language, setLanguage] = useState<"en" | "hi" | "ta" | "mr">("en");

  async function submit() {
    if (!name.trim() || !guardian) return;
    await db.students.create({
      name: name.trim(),
      grade,
      language,
      guardian_id: guardian.id,
    });
    db.seedDemoDataIfEmpty(guardian.id, "s_demo");
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900">Add a student</h3>
        <p className="mt-1 text-sm text-slate-500">
          We only store the minimum info needed to track reading progress.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Child's first name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chinki"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Grade</span>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {["1", "2", "3", "4", "5"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="mr">मराठी</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-40"
          >
            Add student
          </button>
        </div>
      </div>
    </div>
  );
}
