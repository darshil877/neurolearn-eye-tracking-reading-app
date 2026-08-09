# Add English Language Support

- [x] config.ts: add English to LANGUAGES
- [x] phonics.ts: add English phonics bank + title/instructions branch
- [x] db.ts: add English sample story ("Chinki's Ball")
- [x] TeacherDashboard.tsx: add English option in Add Student modal
- [x] Landing.tsx: update marketing copy to include English

## Additional integration (for accurate flagging display)
- [x] StoryReader.tsx: integrate assessReading for richer summary + risk display
- [x] store.ts + gaze/tracker.ts: fix fixation double-counting for accurate stats

## About Dyslexia section on home page
- [x] Landing.tsx: add comprehensive "What is dyslexia?" section with InfoCard components
  - Defines what dyslexia is, root causes, common signs, and how it's detected
  - Explains how NeuroLearn fits in as a screening companion (not a diagnostic)
  - Includes a clear disclaimer that it is educational info, not a medical diagnosis

Build verified with `npm run build`.
