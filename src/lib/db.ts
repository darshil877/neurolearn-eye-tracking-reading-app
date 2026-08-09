// Local-only data layer for the NeuroLearn prototype.
//
// In a real deployment this file would be replaced with a Supabase client
// (@supabase/supabase-js). For the Prasunethon single-file demo build we
// persist everything to localStorage so the demo works with zero backend
// setup — which is what the README calls out as "DEMO_MODE + local store".
// The API shape mirrors the Supabase tables from the spec so swapping in
// a real Postgres backend is a drop-in later.

import { CONSENT_TEXT_VERSION, type LangCode } from "./config";

export type Student = {
  id: string;
  name: string;
  grade: string;
  language: LangCode;
  guardian_id: string;
  created_at: string;
};

export type Consent = {
  id: string;
  student_id: string;
  guardian_id: string;
  guardian_email: string;
  consented_at: string;
  consent_text_version: string;
};

export type Session = {
  id: string;
  student_id: string;
  story_id: string;
  language: LangCode;
  started_at: string;
  finished_at?: string;
  regression_rate: number;
  avg_fixation_ms: number;
  total_saccades: number;
  total_regressions: number;
  long_fixation_count: number;
  flagged: boolean;
  adaptations_triggered: boolean;
  struggled_words: string[];
};

export type SessionWordEvent = {
  id: string;
  session_id: string;
  word: string;
  word_index: number;
  event_type: "fixation" | "long_fixation" | "regression" | "saccade";
  duration_ms: number;
};

export type Story = {
  id: string;
  language: LangCode;
  title: string;
  body: string;
  difficulty_level: number;
};

const KEY = (k: string) => `neurolearn:${k}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY(key));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(KEY(key), JSON.stringify(value));
}

// ---- Auth (local, stand-in for Supabase Auth) ----
export type Guardian = { id: string; email: string; name: string };

export const auth = {
  current(): Guardian | null {
    return read<Guardian | null>("guardian", null);
  },
  signIn(email: string, name: string): Guardian {
    const g: Guardian = { id: "g_" + email.replace(/[^a-z0-9]/gi, ""), email, name: name || email.split("@")[0] };
    write("guardian", g);
    return g;
  },
  signOut() {
    localStorage.removeItem(KEY("guardian"));
  },
};

// ---- Students ----
export const students = {
  async list(guardianId: string): Promise<Student[]> {
    return read<Student[]>("students", []).filter((s) => s.guardian_id === guardianId);
  },
  async create(s: Omit<Student, "id" | "created_at">): Promise<Student> {
    const stu: Student = {
      ...s,
      id: "s_" + Math.random().toString(36).slice(2, 9),
      created_at: new Date().toISOString(),
    };
    const all = read<Student[]>("students", []);
    all.push(stu);
    write("students", all);
    return stu;
  },
};

// ---- Consents ----
export const consents = {
  async forStudent(studentId: string): Promise<Consent | null> {
    return read<Consent[]>("consents", []).find((c) => c.student_id === studentId) ?? null;
  },
  async record(c: Omit<Consent, "id" | "consented_at" | "consent_text_version">): Promise<Consent> {
    const consent: Consent = {
      ...c,
      id: "c_" + Math.random().toString(36).slice(2, 9),
      consented_at: new Date().toISOString(),
      consent_text_version: CONSENT_TEXT_VERSION,
    };
    const all = read<Consent[]>("consents", []);
    all.push(consent);
    write("consents", all);
    return consent;
  },
};

// ---- Stories (sample vernacular content) ----
const SAMPLE_STORIES: Story[] = [
  {
    id: "story-en-1",
    language: "en",
    title: "Chinki's Ball",
    difficulty_level: 1,
    body:
      "Chinki is a little rabbit. She has a red ball. The ball rolled under the tree. Chinki ran and picked up the ball. She was very happy.",
  },
  {
    id: "story-hi-1",
    language: "hi",
    title: "चिंकी की गेंद",
    difficulty_level: 1,
    body:
      "चिंकी एक छोटी खरगोश है। उसकी एक लाल गेंद है। गेंद पेड़ के नीचे लुढ़क गई। चिंकी दौड़ी और गेंद उठा लाई। वह बहुत खुश हुई।",
  },
  {
    id: "story-ta-1",
    language: "ta",
    title: "சின்ன முயல்",
    difficulty_level: 1,
    body:
      "ஒரு சின்ன முயல் காட்டில் வாழ்ந்தது. அதற்கு ஒரு சிவப்பு பந்து இருந்தது. பந்து மரத்தின் கீழே உருண்டது. முயல் ஓடி பந்தை எடுத்தது. அது மிகவும் மகிழ்ச்சி அடைந்தது.",
  },
  {
    id: "story-mr-1",
    language: "mr",
    title: "चिंकूचा चेंडू",
    difficulty_level: 1,
    body:
      "चिंकू एक लहान ससा आहे. त्याच्याजवळ एक लाल चेंडू आहे. चेंडू झाडाखाली लोळला. चिंकू धावला आणि चेंडू आणला. तो खूप आनंदी झाला.",
  },
];

export const stories = {
  async list(language: LangCode): Promise<Story[]> {
    const cached = read<Story[]>("stories", []);
    const merged = [...cached, ...SAMPLE_STORIES].filter((s) => s.language === language);
    return merged;
  },
  async get(id: string): Promise<Story | undefined> {
    const cached = read<Story[]>("stories", []);
    return [...cached, ...SAMPLE_STORIES].find((s) => s.id === id);
  },
};

// ---- Sessions + word events ----
export const sessions = {
  async listForStudent(studentId: string): Promise<Session[]> {
    return read<Session[]>("sessions", [])
      .filter((s) => s.student_id === studentId)
      .sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at));
  },
  async listAll(guardianId: string): Promise<Session[]> {
    const myStudents = (await students.list(guardianId)).map((s) => s.id);
    return read<Session[]>("sessions", [])
      .filter((s) => myStudents.includes(s.student_id))
      .sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at));
  },
  // keep the parameter used so tsc stays happy (guardian id is implicit in students.list)
  _: (_g: string) => void 0,
  async create(data: Omit<Session, "id">): Promise<Session> {
    const s: Session = { ...data, id: "se_" + Math.random().toString(36).slice(2, 9) };
    const all = read<Session[]>("sessions", []);
    all.push(s);
    write("sessions", all);
    return s;
  },
  async update(id: string, patch: Partial<Session>) {
    const all = read<Session[]>("sessions", []);
    const idx = all.findIndex((s) => s.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch };
      write("sessions", all);
    }
  },
};

export const wordEvents = {
  async list(sessionId: string): Promise<SessionWordEvent[]> {
    return read<SessionWordEvent[]>("events", []).filter((e) => e.session_id === sessionId);
  },
  async record(batch: Omit<SessionWordEvent, "id">[]): Promise<void> {
    const all = read<SessionWordEvent[]>("events", []);
    for (const e of batch) {
      all.push({ ...e, id: "ev_" + Math.random().toString(36).slice(2, 9) });
    }
    write("events", all);
  },
};

// ---- Seed a demo flagged session so dashboard has something to show ----
export function seedDemoDataIfEmpty(_guardianId: string, studentId: string) {
  const existing = read<Session[]>("sessions", []);
  if (existing.length > 0) return;
  const now = Date.now();
  const sample: Session[] = [
    {
      id: "se_demo_1",
      student_id: studentId,
      story_id: "story-hi-1",
      language: "hi",
      started_at: new Date(now - 86400000 * 6).toISOString(),
      finished_at: new Date(now - 86400000 * 6 + 180000).toISOString(),
      regression_rate: 0.08,
      avg_fixation_ms: 260,
      total_saccades: 62,
      total_regressions: 5,
      long_fixation_count: 3,
      flagged: false,
      adaptations_triggered: false,
      struggled_words: [],
    },
    {
      id: "se_demo_2",
      student_id: studentId,
      story_id: "story-hi-1",
      language: "hi",
      started_at: new Date(now - 86400000 * 3).toISOString(),
      finished_at: new Date(now - 86400000 * 3 + 210000).toISOString(),
      regression_rate: 0.22,
      avg_fixation_ms: 340,
      total_saccades: 70,
      total_regressions: 15,
      long_fixation_count: 9,
      flagged: false,
      adaptations_triggered: false,
      struggled_words: ["गेंद", "लुढ़क"],
    },
    {
      id: "se_demo_3",
      student_id: studentId,
      story_id: "story-hi-1",
      language: "hi",
      started_at: new Date(now - 86400000).toISOString(),
      finished_at: new Date(now - 86400000 + 260000).toISOString(),
      regression_rate: 0.38,
      avg_fixation_ms: 520,
      total_saccades: 78,
      total_regressions: 30,
      long_fixation_count: 18,
      flagged: true,
      adaptations_triggered: true,
      struggled_words: ["खरगोश", "लुढ़क", "उठा", "खुश"],
    },
  ];
  write("sessions", sample);
}
