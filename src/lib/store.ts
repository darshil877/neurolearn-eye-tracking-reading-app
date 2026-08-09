import { create } from "zustand";
import type { Guardian, Session, Student } from "./db";
import * as db from "./db";

interface Route {
  name: "landing" | "signin" | "dashboard" | "student-setup" | "consent" | "reading" | "phonics" | "session-summary" | "teacher-dashboard";
  params?: Record<string, string>;
}

interface AppState {
  guardian: Guardian | null;
  route: Route;
  selectedStudent: Student | null;
  currentSession: Session | null;
  adaptationLevel: number; // 0 = off, 1..4 ramps up font, spacing, tint, highlight
  hesitancyEvents: number; // rolling count, drives adaptation ramp
  liveStats: {
    saccades: number;
    regressions: number;
    longFixations: number;
    avgFixation: number;
    fixationTotal: number;
    fixationCount: number;
    struggledWords: Record<string, number>;
  };
  init: () => Promise<void>;
  signIn: (email: string, name: string) => Promise<void>;
  signOut: () => void;
  navigate: (r: Route) => void;
  setStudent: (s: Student | null) => void;
  setSession: (s: Session | null) => void;
  bumpAdaptation: () => void;
  resetAdaptation: () => void;
  recordEvent: (e: { type: string; word: string; durationMs: number }) => void;
  resetLiveStats: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  guardian: null,
  route: { name: "landing" },
  selectedStudent: null,
  currentSession: null,
  adaptationLevel: 0,
  hesitancyEvents: 0,
  liveStats: {
    saccades: 0,
    regressions: 0,
    longFixations: 0,
    avgFixation: 0,
    fixationTotal: 0,
    fixationCount: 0,
    struggledWords: {},
  },
  async init() {
    const g = db.auth.current();
    if (g) set({ guardian: g, route: { name: "dashboard" } });
  },
  async signIn(email, name) {
    const g = db.auth.signIn(email, name);
    set({ guardian: g, route: { name: "dashboard" } });
  },
  signOut() {
    db.auth.signOut();
    set({ guardian: null, route: { name: "landing" }, selectedStudent: null });
  },
  navigate(r) {
    set({ route: r });
  },
  setStudent(s) {
    set({ selectedStudent: s });
  },
  setSession(s) {
    set({ currentSession: s });
  },
  bumpAdaptation() {
    const { adaptationLevel } = get();
    if (adaptationLevel < 4) set({ adaptationLevel: adaptationLevel + 1 });
  },
  resetAdaptation() {
    set({ adaptationLevel: 0 });
  },
  recordEvent(e) {
    const ls = { ...get().liveStats };
    if (e.type === "saccade") ls.saccades++;
    if (e.type === "regression") {
      ls.regressions++;
      // regression counts as a hesitation signal
      set({ hesitancyEvents: get().hesitancyEvents + 1 });
    }
    if (e.type === "long_fixation") {
      ls.longFixations++;
      ls.fixationTotal += e.durationMs;
      ls.fixationCount += 1;
      ls.avgFixation = ls.fixationTotal / Math.max(1, ls.fixationCount);
      ls.struggledWords[e.word] = (ls.struggledWords[e.word] || 0) + 1;
      set({ hesitancyEvents: get().hesitancyEvents + 1 });
    }
    if (e.type === "fixation") {
      ls.fixationTotal += e.durationMs;
      ls.fixationCount += 1;
      ls.avgFixation = ls.fixationTotal / Math.max(1, ls.fixationCount);
    }
    set({ liveStats: ls });
  },
  resetLiveStats() {
    set({
      liveStats: {
        saccades: 0,
        regressions: 0,
        longFixations: 0,
        avgFixation: 0,
        fixationTotal: 0,
        fixationCount: 0,
        struggledWords: {},
      },
      hesitancyEvents: 0,
      adaptationLevel: 0,
    });
  },
}));
