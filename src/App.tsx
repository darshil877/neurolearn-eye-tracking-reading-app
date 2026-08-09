import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Landing } from "@/components/Landing";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { ConsentGate } from "@/components/ConsentGate";
import { StoryReader } from "@/components/StoryReader";
import * as db from "@/lib/db";
import type { Story } from "@/lib/db";
import "./components/OpenDyslexic.css";

export default function App() {
  const guardian = useStore((s) => s.guardian);
  const route = useStore((s) => s.route);
  const navigate = useStore((s) => s.navigate);
  const selectedStudent = useStore((s) => s.selectedStudent);
  const resetLiveStats = useStore((s) => s.resetLiveStats);
  const resetAdaptation = useStore((s) => s.resetAdaptation);
  const liveStats = useStore((s) => s.liveStats);

  const [story, setStory] = useState<Story | null>(null);

  // Load the guardian session on mount
  useEffect(() => {
    useStore.getState().init();
  }, []);

  // If we land on /consent or /reading without a selected student, bounce back
  useEffect(() => {
    if ((route.name === "consent" || route.name === "reading") && !selectedStudent) {
      navigate({ name: "dashboard" });
    }
  }, [route, selectedStudent, navigate]);

  // Preload a story matching the student's language once consent is given
  useEffect(() => {
    if (route.name === "reading" && selectedStudent && !story) {
      db.stories.list(selectedStudent.language).then((list) => {
        setStory(list[0]);
      });
    }
  }, [route, selectedStudent, story]);

  if (!guardian) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top brand ribbon for in-app pages */}
      {route.name !== "reading" && (
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 font-extrabold text-slate-900">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                <span className="text-[11px]">N</span>
              </div>
              <span className="text-sm">NeuroLearn</span>
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                PROTOTYPE • NOT A MEDICAL DEVICE
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="py-6 px-4">
        {route.name === "dashboard" && <TeacherDashboard />}

        {route.name === "consent" && selectedStudent && (
          <ConsentGate
            student={selectedStudent}
            onConsented={async () => {
              resetLiveStats();
              resetAdaptation();
              navigate({ name: "reading" });
            }}
          />
        )}

        {route.name === "reading" && selectedStudent && story && (
          <StoryReader
            story={story}
            onDone={async ({ flagged, struggledWords, regressionRate, avgFixation }) => {
              // Persist the session to the local DB
              await db.sessions.create({
                student_id: selectedStudent.id,
                story_id: story.id,
                language: selectedStudent.language,
                started_at: new Date(Date.now() - 60_000).toISOString(), // approximate
                finished_at: new Date().toISOString(),
                regression_rate: regressionRate,
                avg_fixation_ms: avgFixation,
                total_saccades: liveStats.saccades,
                total_regressions: liveStats.regressions,
                long_fixation_count: liveStats.longFixations,
                flagged,
                adaptations_triggered: useStore.getState().adaptationLevel > 0,
                struggled_words: struggledWords,
              });
              // stay on summary (handled inside StoryReader) then route to dashboard
              setTimeout(() => navigate({ name: "dashboard" }), 3000);
            }}
          />
        )}

        {route.name === "reading" && !story && (
          <div className="max-w-xl mx-auto mt-12 rounded-3xl bg-white p-10 text-center shadow">
            <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-slate-600">Loading story…</p>
          </div>
        )}
      </main>
    </div>
  );
}
