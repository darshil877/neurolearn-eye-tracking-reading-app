# Add English Language Support

Steps:
- [x] 1. config.ts: add English to LANGUAGES
- [x] 2. phonics.ts: add English phonics bank + title/instructions branch
- [x] 3. db.ts: add English sample story
- [x] 4. TeacherDashboard.tsx: add English option in Add Student modal
- [x] 5. Landing.tsx: update marketing copy to include English

Camera/tracker fixes:
- [x] Fix MediaPipe WASM version mismatch (0.10.22 → 1.0.1)
- [x] Add GPU → CPU delegate fallback for FaceLandmarker
- [x] Collapse duplicate frameloop (onFrame/onFrame2, processSample/processAndStore)
- [x] Graceful demo-tracker fallback when live camera fails
- [x] Add multi-CDN wasm + model mirrors and in-memory model loading
- [x] Verify build compiles
