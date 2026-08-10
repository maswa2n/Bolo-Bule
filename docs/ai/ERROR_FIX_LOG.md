# ERROR FIX LOG

_(Add entries newest first. Use template from Rule 02 / `.cursor/rules/02-knowledge-loop.mdc`.)_

## 2026-08-10 — Mobile coach voice tidak bersuara (iOS Safari TTS)
- **Symptom:** Tombol "Play coach audio" di `/practice` tidak menghasilkan suara saat dibuka di browser handphone (terutama iPhone Safari).
- **Root cause:** `speakCoachWithBrowserTts()` melakukan `await getCoachBrowserVoice()` sebelum `speechSynthesis.speak()`, sehingga iOS Safari memutus user-gesture chain dan memblokir output audio secara silent.
- **Fix:** Tambah `speakCoachSync()` (speak sinkron dalam handler tap), `primeCoachBrowserTts()` + `primeMobileCoachAudio()` pada interaksi pertama; prefetch cloud MP3 via edge function `coach-tts` + route `/api/coach-tts`; fallback otomatis ke browser TTS.
- **Prevention update:** TTS mobile wajib speak sinkron dalam event handler; async voice loading hanya untuk prefetch; cloud TTS via Supabase edge function + `<audio>` untuk kualitas konsisten.
- **Files touched:** `src/lib/ai/tts.ts`, `src/lib/ai/coach-audio-player.ts`, `src/components/practice/SpeakingSession.tsx`, `src/app/api/coach-tts/route.ts`, `supabase/functions/coach-tts/index.ts`, `tsconfig.json`, `docs/ai/*`
- **Verification:** MCP deploy `coach-tts` ACTIVE (PASS); `npm run lint` + `npm run build` (PASS). Manual iPhone/Android audio (MANUAL_PENDING).

## 2026-08-10 — Vercel build: /practice Dynamic server usage (cookies)
- **Symptom:** Vercel production build log: `[listPublishedCases] Unexpected error: Dynamic server usage: Route /practice couldn't be rendered statically because it used cookies`.
- **Root cause:** `listPublishedCases()` memanggil `createClient()` dari `@/lib/supabase/server` yang memakai `cookies()` dari `next/headers`. Next.js 15 mencoba pre-render `/practice` secara statis saat build; pemanggilan `cookies()` memicu `DYNAMIC_SERVER_USAGE`.
- **Fix:** Tambah `createStaticClient()` di `@/lib/supabase/static` (SSR client dengan cookie handler kosong, tanpa `next/headers`); `listPublishedCases()` pakai static client karena RLS `learning_case_versions_select` mengizinkan anon read untuk `status = 'published'`.
- **Prevention update:** Data publik/RLS-anon untuk halaman yang bisa di-SSG → gunakan `createStaticClient()`, bukan server client ber-cookie.
- **Files touched:** `src/lib/supabase/static.ts`, `src/lib/learning/case-repository.ts`, `docs/ai/*`
- **Verification:** MCP `execute_sql` published count=1 (PASS); `npm run lint` (PASS); `npm run build` (PASS, `/practice` static ○, no Dynamic server error).

## 2026-08-10 — Practice console layout.css 404 + translateSupportOptionAction POST 500
- **Symptom:** Console menampilkan `layout.css 404` dan `POST /practice 500` saat klik pilihan jawaban (`translateSupportOptionAction`).
- **Root cause:** Dev server stale/HMR — chunk CSS `/_next/static/css/app/layout.css` tidak ditemukan (404); client bundle server-action ID tidak sinkron dengan server → POST 500. Kontribusi sekunder: action berat di `actions.ts` + cache phrase RLS hanya `authenticated` sehingga anon selalu hit LLM.
- **Fix:** Pisah `translateSupportOptionAction` ke `phrase-actions.ts`; short-circuit known phrase + timeout LLM + fallback lokal di `phrase-translation.ts`; migration anon SELECT pada `practice_phrase_translations`; nav AppShell pakai `Link`.
- **Prevention update:** Setelah error HMR/CSS 404, restart satu `next dev` + hapus `.next`; server action ringan per domain; cache phrase readable anon.
- **Files touched:** `src/app/(app)/practice/phrase-actions.ts`, `src/app/(app)/practice/actions.ts`, `src/lib/learning/phrase-translation.ts`, `src/lib/learning/response-support-guide.ts`, `src/components/practice/SpeakingSession.tsx`, `src/components/layout/AppShell.tsx`, `supabase/migrations/20260810103000_practice_phrase_translations_anon_read.sql`, `docs/ai/*`
- **Verification:** `npm run lint` (PASS), `npm run build` (PASS), `db push` (PASS), MCP RLS smoke (PASS), browser klik jawaban POST 200 (PASS). Manual: restart dev bersih (MANUAL_PENDING).

## 2026-08-09 — Published case tidak muncul di Practice Case Bank (PGRST201)
- **Symptom:** Kasus published dari Admin Cases (Performance Review) tidak tampil di `/practice` Case Bank; yang tampil hanya seed default.
- **Root cause:** Query `listPublishedCases()` embed `learning_cases(...)` ambigu — PostgREST PGRST201 (dua FK: `case_id` vs `current_version_id`). Error disembunyikan; fallback ke `seedCaseBank`.
- **Fix:** Gunakan hint eksplisit `learning_cases!learning_case_versions_case_id_fkey(...)`; on query error return `[]` (bukan seed) + log error.
- **Prevention update:** Setiap Supabase nested embed wajib disambiguate jika ada >1 FK; jangan fallback seed saat query error.
- **Files touched:** `src/lib/learning/case-repository.ts`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_LOG.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** anon REST curl dengan FK hint → Performance Review returned (PASS); `npm run lint` + `npm run build` (PASS). Manual `/practice` refresh (MANUAL_PENDING).

## 2026-08-08 — Generate candidate Unauthorized (no auth session)
- **Symptom:** Tombol Generate Candidate di `/cases` gagal dengan pesan `Unauthorized`.
- **Root cause:** RPC `enqueue_case_candidate` menolak request tanpa `auth.uid()`; aplikasi belum punya halaman login sehingga server action memanggil Supabase sebagai anon. Selain itu `is_admin_or_reviewer()` hanya membaca JWT `app_metadata.role`, bukan `profiles.role`.
- **Fix:** Tambah `/login` + middleware guard admin routes; `ensureProfileAction` bootstrap profile (user pertama = admin); migration perbaiki `current_app_role()` agar membaca `profiles.role`; auth guard di admin server actions.
- **Prevention update:** Semua admin RPC/action wajib `requireAdminSession()`; role admin/reviewer harus konsisten via `profiles.role`; route `/cases` dan `/evaluation` redirect ke login jika belum auth.
- **Files touched:** `supabase/migrations/20260808160000_fix_current_app_role_and_auth_bootstrap.sql`, `src/app/login/*`, `src/lib/auth/*`, `src/lib/supabase/middleware.ts`, `src/app/(admin)/cases/actions.ts`, `src/app/(admin)/evaluation/actions.ts`, `src/components/layout/AppShell.tsx`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** `npm run lint` (PASS), `npm run build` (PASS), `npx supabase db push --include-all` (PASS), MCP `current_app_role` reads profiles (PASS). Manual: login → generate → publish (MANUAL_PENDING).

## 2026-08-08 — Ollama Cloud model 403 subscription required
- **Symptom:** Edge smoke invoke setelah Option A secrets mengembalikan HTTP 500; body `Ollama HTTP 403: this model requires a subscription`.
- **Root cause:** Secret `OLLAMA_MODEL=qwen3.5:397b` membutuhkan plan Pro/Max Ollama Cloud; akun Free tidak punya akses model tier tinggi tersebut.
- **Fix:** Ubah secret ke `OLLAMA_MODEL=gpt-oss:20b` (usage level 1, Free tier). Ulang smoke `practice_coach` dan `case_enrichment` → keduanya `ok: true`.
- **Prevention update:** Dokumentasi setup wajib membedakan model Free vs Pro; smoke invoke wajib setelah set secrets; jika 403 subscription, ganti ke model level 1–2 atau upgrade plan.
- **Files touched:** Supabase secrets (`OLLAMA_MODEL`), `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** edge smoke `practice_coach` (PASS), edge smoke `case_enrichment` (PASS), MCP edge log POST 200 (PASS).

## 2026-08-08 — Ollama gateway smoke failed on default localhost endpoint
- **Symptom:** Invoke ke edge function `learning-llm-gateway` mengembalikan HTTP 500 saat smoke test.
- **Root cause:** Secret `OLLAMA_BASE_URL` belum diarahkan ke endpoint Ollama yang reachable dari Supabase runtime; fallback default `http://127.0.0.1:11434` menolak koneksi.
- **Fix:** Set `OLLAMA_BASE_URL=https://ollama.com` + API key (Option A); pipeline speaking + enrichment tetap fallback-safe jika gateway gagal.
- **Prevention update:** Untuk integrasi LLM edge baru, wajib smoke invoke pasca deploy + validasi secret (`LLM_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`) sebelum status PASS.
- **Files touched:** `supabase/functions/learning-llm-gateway/index.ts`, `src/lib/ai/ollama-practice-coach.ts`, `src/app/(app)/practice/actions.ts`, `src/lib/learning/case-repository.ts`, `src/app/(admin)/cases/actions.ts`, `src/lib/learning/evaluation-lab.ts`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** `npm run lint` (PASS), `npm run build` (PASS), deploy function (PASS), edge smoke invoke setelah Option A (PASS setelah model diganti ke `gpt-oss:20b`).

## 2026-08-08 — Speaking evaluator drift vs server state
- **Symptom:** Feedback/score dan kelayakan completion di UI speaking berpotensi berbeda dari status sesi tersimpan karena ada evaluasi heuristic lokal di client.
- **Root cause:** `SpeakingSession` menghitung evaluasi sendiri sebelum/di luar hasil authoritative dari server action, sehingga bisa terjadi dual source-of-truth.
- **Fix:** Ubah flow speaking agar submit turn selalu memakai hasil `evaluation + session` dari `submitPracticeTurnAction`; feedback UI dibangun dari evaluator server; completion status mengikuti data persistence.
- **Prevention update:** Untuk modul learning stateful, evaluasi/transition harus authoritative di server; client hanya renderer hasil server, bukan evaluator utama.
- **Files touched:** `src/components/practice/SpeakingSession.tsx`, `src/app/(app)/practice/practice-workspace.tsx`, `src/app/(app)/practice/actions.ts`, `src/lib/learning/conversation-state-machine.ts`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** `npm run lint` (PASS), `npm run build` (PASS), manual browser flow `/practice` (MANUAL_PENDING).

## 2026-08-08 — PNG logo source-of-truth alignment
- **Symptom:** Branding menggunakan placeholder dan aset SVG sementara source logo yang disepakati adalah PNG asli dari user.
- **Root cause:** Belum ada aset PNG resmi di `public` dan referensi logo lintas layout/page belum distandardkan.
- **Fix:** Tambah `public/branding/bolo-bule-logo.png`; ganti referensi logo di shell, marketing, icon metadata, dan watermark ke PNG; hapus aset SVG agar tidak jadi source paralel.
- **Prevention update:** Setiap revisi branding wajib menetapkan single source-of-truth asset di `public/branding` dan dipakai konsisten di shell + marketing + metadata.
- **Files touched:** `public/branding/bolo-bule-logo.png`, `src/components/layout/AppShell.tsx`, `src/app/(marketing)/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** `npm run lint` (PASS), `npm run build` (PASS), manual visual check `/` dan `/today` (MANUAL_PENDING).

## 2026-08-06 — AppShell dashboard webpack_require__.n dev crash
- **Symptom:** Runtime `TypeError: __webpack_require__.n is not a function` saat masuk dashboard (`/today`, `/practice`, dll.) di `AppShell.tsx` dev mode.
- **Root cause:** Race condition HMR webpack dev saat client chunk `AppShell` dievaluasi; default import `next/link` memanggil `__webpack_require__.n` sebelum helper runtime tersedia (Next.js issue #67783).
- **Fix:** Ganti `Link` default import dengan `<a href>` + `router.push` (named import dari `next/navigation`); gunakan `import type` untuk `PropsWithChildren`; hapus cache `.next`.
- **Prevention update:** Hindari default import CJS interop di client layout shell kecuali diperlukan; prefer named hooks + anchor/router navigation; clear `.next` jika error HMR muncul ulang di dev.
- **Files touched:** `src/components/layout/AppShell.tsx`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** `npm run lint` (PASS), `npm run build` (PASS), MCP `execute_sql` tables `learning_sessions`/`evaluation_runs` exist (PASS); dev browser MANUAL_PENDING.

## 2026-08-06 — Migration index references missing column
- **Symptom:** `npx supabase db push --include-all` gagal dengan `SQLSTATE 42703` pada index `learning_case_versions_status_idx` karena kolom `domain` tidak ada di tabel `learning_case_versions`.
- **Root cause:** Definisi index menggunakan kolom domain yang sebenarnya berada di tabel `learning_cases`, bukan `learning_case_versions`.
- **Fix:** Ubah index menjadi `ON public.learning_case_versions (status, internal_level, case_id)` lalu jalankan ulang `db push`.
- **Prevention update:** Tambahkan verifikasi eksplisit bahwa semua kolom index ada di tabel yang sama sebelum `db push`; catat hasilnya di `CHANGE_CHECKLIST` gate.
- **Files touched:** `supabase/migrations/20260806142000_bolo_bule_learning_engine_foundation.sql`, `docs/ai/CHANGE_CHECKLIST.md`, `docs/ai/ERROR_FIX_INDEX.json`
- **Verification:** `npx supabase db push --include-all` (FAIL lalu PASS), `npx supabase migration list` (PASS local=remote).

## Entry template

```markdown
## YYYY-MM-DD — <short title>
- **Symptom:**
- **Root cause:**
- **Fix:**
- **Prevention update:**
- **Files touched:**
- **Verification:** <commands + PASS/FAIL>
```
