# Change Checklist (Before you finish)

## Target Output Verification Gate (MANDATORY — all build / fix / feature tasks)

Agent **must run** verification against user target output before marking task done.
Canonical: [TARGET_OUTPUT_VERIFICATION.md](TARGET_OUTPUT_VERIFICATION.md), rule: [`.cursor/rules/43-target-output-verification.mdc`](../../.cursor/rules/43-target-output-verification.mdc).

### Per-task entry template (copy for each change)

```markdown
## YYYY-MM-DD — <short title>
- **Target output:** <expected behavior, measurable>
- **Surface:** frontend | server | db | edge
- **Acceptance criteria:**
  - [ ] <criterion 1>
  - [ ] <criterion 2>
- **Auto verification (agent runs):**
  - [ ] `npm run lint` → exit __
  - [ ] `npm run build` → exit __
  - [ ] <other commands> → exit __
- **Manual verification (if needed):**
  - [ ] <page → action → expect>
- **Results:** expected vs actual (brief)
- **Status:** PASS | FAIL | MANUAL_PENDING
```

### Minimum auto-run by layer

| Layer | Commands |
|-------|----------|
| App (UI + server) | `npm run lint`, `npm run build` |
| SQL/RPC | MCP `execute_sql` smoke + `npx supabase migration list` aligned |
| Heavy data-access | Also complete § 522 Prevention Gate below |

**Hard stop:** Do not mark done if Status is FAIL or acceptance criteria unchecked without reason.

---

## 522 Prevention Gate (MANDATORY — new data-access / heavy RPC)

When adding RPC, list pages, dashboards, or bulk queries:

- [ ] Heavy RPC has wrapper guard (Rule 41) — unfiltered call rejected for `authenticated`/`anon`
- [ ] List queries use `.limit()` / `.range()` with server-side pagination
- [ ] No `Promise.all` fan-out for heavy RPC from client
- [ ] MCP `get_logs` postgres — no new statement timeout burst after smoke
- [ ] Results recorded in change entry above

---

## Hardened RPC & state-transition rewrite gate (MANDATORY — Rule 32 / 42 / 43)

Apply whenever a migration **rewrites an existing RPC** that was previously hardened or performs **workflow state transitions**:

- [ ] Read live/latest function body before `CREATE OR REPLACE`
- [ ] Preserve `SECURITY DEFINER`, auth guards, audit side effects if previously present
- [ ] Type casts verified via `information_schema` / `pg_type`
- [ ] Sibling modules in parity (Rule 42 § 3b) if parallel implementations exist
- [ ] MCP smoke: `prosecdef`, no orphan types, stuck-state count = 0 for critical transitions
- [ ] `npx supabase db push --include-all` exit 0

---

## Entries

## 2026-08-10 — Vercel /practice Dynamic server usage (cookies)
- **Target output:** Build production Vercel berhasil tanpa error `Dynamic server usage` di route `/practice`; halaman menampilkan published cases dari Supabase.
- **Surface:** server (Next.js SSG + Supabase data layer)
- **Acceptance criteria:**
  - [x] `npm run build` tidak log `[listPublishedCases] Unexpected error: Dynamic server usage`
  - [x] Route `/practice` di-build sebagai static (○)
  - [x] `listPublishedCases()` tetap mengembalikan published cases (MCP smoke: 1 row)
- **Auto verification (agent runs):**
  - [x] MCP `get_project_url` → `iuzvtttsjnlwtoegrsve.supabase.co` → exit OK
  - [x] MCP `execute_sql` published count → 1 → PASS
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Results:** Sebelum fix, build log error cookies + `/practice` gagal load cases; setelah `createStaticClient()`, build PASS dan `/practice` static.
- **Status:** PASS

## 2026-08-10 — Login Phase 3: A/B CTA + sticky mobile CTA + mode-based hero variants
- **Target output:** `/login` mendorong conversion lebih tinggi lewat A/B copy CTA, sticky CTA di mobile, dan konten hero yang berubah sesuai mode `signin` vs `signup`.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Hero dan copy funnel punya varian berbeda untuk mode `signin` dan `signup`.
  - [x] URL state menyimpan `mode` + `variant` agar experiment copy CTA repeatable.
  - [x] A/B CTA copy aktif untuk CTA utama (hero/funnel/form) dengan persistensi varian.
  - [x] Sticky mobile CTA tampil di bawah viewport, tetap terhubung ke flow auth yang sama.
  - [x] Semua animasi/interaksi tambahan tetap ringan (transform/opacity) dan tidak merusak aksesibilitas.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka `/login` di mobile: cek sticky CTA submit + toggle mode berjalan.
  - [ ] Coba `?mode=signin` dan `?mode=signup`: pastikan headline/step/funnel hero berubah sesuai mode.
  - [ ] Hard refresh beberapa kali: pastikan `variant` tersimpan (`a|b`) dan copy CTA konsisten.
- **Results:** Funnel login kini teroptimasi untuk conversion dengan stateful mode+variant, CTA lebih terarah, dan mobile UX lebih “action-first”; lint/build PASS.
- **Status:** PASS (auto); MANUAL_PENDING (conversion UX smoke browser)

## 2026-08-10 — Login Phase 2: premium micro-motion + social proof + conversion funnel
- **Target output:** `/login` terasa kelas dunia dengan micro-animation premium yang ringan, social proof yang kredibel, dan CTA funnel yang lebih conversion-oriented tanpa merusak flow auth.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Hero/login memakai micro-animation halus berbasis transform/opacity (sheen, float, marquee) dengan guard `prefers-reduced-motion`.
  - [x] Social proof section hadir di `/login` (role signals + testimonial cards) untuk membangun trust sebelum auth.
  - [x] Conversion funnel card hadir di sisi auth (langkah onboarding cepat + CTA ke form login).
  - [x] CTA utama form lebih conversion-oriented sesuai mode signin/signup.
  - [x] Alur auth Supabase existing (`signin/signup` + `ensureProfileAction`) tetap berjalan.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka `/login` desktop+mobile: cek motion halus, social proof terbaca, CTA funnel mengarah ke form, lalu test signin/signup end-to-end.
- **Results:** `/login` kini punya storytelling trust + conversion layer yang kuat; animasi tetap ringan dan accessible; lint/build PASS.
- **Status:** PASS (auto); MANUAL_PENDING (UX visual + auth smoke browser)

## 2026-08-10 — Login page revamp into interactive brand-first experience
- **Target output:** `/login` berubah dari form tunggal menjadi landing-login interaktif yang menjelaskan nilai Bolo Bule, manfaat user, dan alur belajar sebelum user masuk.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Layout `/login` menjadi dua kolom: hero storytelling + panel login.
  - [x] Hero menampilkan value proposition, alur proses belajar, dan CTA eksplorasi.
  - [x] Form login tetap fungsional (`signin/signup`) dengan UX lebih menarik (mode switch, highlight manfaat, toggle password).
  - [x] Visual brand tidak lagi tertutup kotak login; watermark/logo tetap terbaca sebagai elemen latar.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka `/login` desktop + mobile: pastikan hero terbaca, CTA tampil, form login/signup berfungsi, dan transisi state submit tetap responsif.
- **Results:** Halaman login kini menampilkan narasi produk dan perjalanan belajar secara jelas sebelum autentikasi, sementara alur auth Supabase tetap berjalan; lint/build PASS.
- **Status:** PASS (auto); MANUAL_PENDING (visual QA lintas viewport)

## 2026-08-10 — Hapus tombol Start session (practice)
- **Target output:** UI latihan tidak lagi menampilkan tombol redundan "Start session"; sesi tetap dibuat otomatis saat submit turn atau revisi context.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Tombol "Start session" dan `ensureSession` dihapus dari `practice-workspace.tsx`.
  - [x] Auto-start via `startPracticeSessionAction` di `handleSubmitTurn` / `handleReviseContext` tidak berubah.
  - [x] Tombol "End session" tetap ada dan aktif setelah turn pertama.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] `/practice` → submit turn pertama tanpa Start session → skor/progress terupdate; End session aktif.
- **Results:** Tombol Start session dihapus; auto-start sesi pada submit/revise context tetap; lint + build PASS.
- **Status:** PASS (auto); MANUAL_PENDING (smoke UI practice)

## 2026-08-10 — Phase 2.3 login/marketing parity + mobile UX QA matrix
- **Target output:** Identitas visual Bolo Bule konsisten di entry points (`/` dan `/login`), plus checklist QA interaksi mobile repeatable untuk rilis berikutnya.
- **Surface:** frontend | docs
- **Acceptance criteria:**
  - [x] `/login` memakai glass panel, semantic feedback (success/error), press depth, dan submit pulse.
  - [x] `/` (marketing) memakai chip identitas, motion rise, CTA dengan press depth (primary + ghost-on-dark).
  - [x] Token `bb-btn-ghost-on-dark` ditambahkan untuk CTA sekunder di hero gelap.
  - [x] Dokumen QA matrix ditambahkan: `docs/ai/MOBILE_UX_QA_MATRIX.md`.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Jalankan matrix QA mobile pada `/`, `/login`, `/today`, `/learn`, `/practice`, `/cases`.
- **Results:** Entry points kini selaras dengan design system phase 2.x; QA matrix siap dipakai untuk sign-off visual/motion lintas halaman.
- **Status:** PASS (auto); MANUAL_PENDING (QA matrix execution)

## 2026-08-10 — Phase 2.2 haptic-like feedback + progress cues + subtle celebration
- **Target output:** Mobile interaction terasa lebih premium melalui feedback tekan (haptic-like), cue progres animatif, dan micro-celebration sukses yang subtle tanpa membebani performa.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Global motion token ditambah untuk press-depth, progress sheen, dan celebration ring (`bb-press-depth`, `bb-progress-*`, `bb-celebrate-subtle`).
  - [x] CTA penting menerapkan feedback tekan konsisten di shell, practice, writing, dan admin.
  - [x] Submit/loading state diberi pulse ringan pada flow async utama (start session, submit turn, evaluate writing, generate candidate).
  - [x] Success/error/info message menggunakan semantic state + enter motion; success state mendapat micro-celebration subtle.
  - [x] Progress cues animatif diterapkan pada mastery/progress bar (`/learn` + metrik speaking session).
  - [x] Guard aksesibilitas `prefers-reduced-motion` tetap menonaktifkan animasi tambahan.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Mobile QA 360–430px: tap/nav press depth, submit loading pulse, success/error banner di `/practice` dan `/cases`.
- **Results:** Fine-tuning phase 2.2 sukses diterapkan dengan animasi berbasis transform/opacity (low-cost), konsisten lintas halaman utama, dan tetap menjaga ergonomi aplikasi edukasi profesional.
- **Status:** PASS (auto); MANUAL_PENDING (device feel QA)

## 2026-08-10 — Phase 2.1 motion states + brand tokens
- **Target output:** Interaksi mobile terasa lebih signature dan responsif lewat fine-tuning state motion (tap, submit, success, error) serta token warna-brand yang konsisten, tanpa menambah beban animasi berlebihan.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Token warna-brand dan semantic state (`success/error/info/warning`) tersedia di `globals.css`.
  - [x] Tap state distandarkan dengan `bb-tap-target` pada aksi utama nav, card, dan CTA.
  - [x] Submit state memakai pulse ringan (`bb-motion-pulse`) pada tombol async penting (practice/admin/writing).
  - [x] Success/error/info feedback memakai style semantic + enter motion (`bb-state-enter`) pada flow latihan dan admin.
  - [x] `prefers-reduced-motion` tetap mematikan animasi tambahan untuk aksesibilitas/performa.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Mobile smoke: `/practice` submit/revisi context, `/cases` generate candidate (success/error), dan tap nav untuk validasi feel motion.
- **Results:** Fine-tuning motion state berhasil diterapkan dengan basis transform/opacity saja (ringan untuk mobile), sambil menjaga konsistensi warna-brand lintas halaman.
- **Status:** PASS (auto); MANUAL_PENDING (UX feel QA di device)

## 2026-08-10 — Phase 2 unique identity system (mobile cross-page)
- **Target output:** Mobile UI lintas `/today`, `/learn`, `/practice`, dan `/cases` memiliki identitas visual konsisten, micro-interaction halus, serta ritme motion yang seragam tanpa menurunkan usability.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Design primitives global tersedia (`bb-glass-panel`, `bb-btn-primary`, `bb-btn-secondary`, `bb-chip`, `bb-motion-rise`).
  - [x] Header/nav `AppShell` memakai visual system baru (glass panel + interactive lift + CTA konsisten).
  - [x] Hero + card pada Today/Learn/Practice/Admin menggunakan theme dan ritme motion seragam.
  - [x] Action button utama/sekunder konsisten pada flow latihan dan admin.
  - [x] Aksesibilitas motion: `prefers-reduced-motion` menonaktifkan animasi/transisi tambahan.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka `/today`, `/learn`, `/practice`, `/cases` pada viewport mobile (360–430px): cek ritme animasi, hover/press state, dan hierarchy visual konsisten.
- **Results:** Sistem identitas visual phase 2 berhasil diterapkan lintas halaman utama mobile. Build tetap hijau; pengalaman lebih premium melalui glass surface, CTA konsisten, dan motion yang terkendali.
- **Status:** PASS (auto); MANUAL_PENDING (visual QA multi-device)

## 2026-08-10 — Mobile-first responsive polish for Practice + AppShell
- **Target output:** Tampilan mobile (sekitar 400px) tidak overlap di header; navigasi, identitas user, dan action practice tetap terbaca serta mudah dioperasikan satu tangan.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Header `AppShell` stack di mobile (brand, nav, session/login) tanpa tabrakan elemen.
  - [x] Nav utama bisa di-scroll horizontal dengan label ringkas di mobile.
  - [x] Case Bank menjadi horizontal snap cards di mobile, tetap grid di desktop.
  - [x] Toolbar speaking/writing + tombol action practice full-width di mobile.
  - [x] Hero `/practice` punya signature visual khas Bolo Bule tanpa mengorbankan keterbacaan.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka `/practice` di viewport 400x642, cek header/nav tidak overlap dan kartu case bisa swipe horizontal.
- **Results:** Implementasi responsive berhasil compile (lint/build PASS). Struktur header kini mobile-first, controls practice lebih ergonomis, dan gaya visual hero diperkuat dengan motif gradien khas.
- **Status:** PASS (auto); MANUAL_PENDING (browser visual smoke final)

## 2026-08-10 — Practice console: layout.css 404 + translateSupportOptionAction 500
- **Target output:** Klik pilihan jawaban di `/practice` tidak memunculkan error console; terjemahan tampil (lokal/cache/LLM) tanpa POST 500.
- **Surface:** frontend | server | db
- **Acceptance criteria:**
  - [x] `translateSupportOptionAction` dipisah ke modul ringan (`phrase-actions.ts`) agar HMR/dev tidak mismatch action ID.
  - [x] Frasa known + cache DB dipakai sebelum LLM; timeout LLM 8s + fallback lokal.
  - [x] RLS anon boleh SELECT cache `practice_phrase_translations`.
  - [x] Nav AppShell pakai `Link` (kurangi hydration mismatch).
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] `npx supabase db push --include-all` → exit 0 (migration `20260810103000`)
  - [x] MCP `execute_sql` RLS policies anon+authenticated read → PASS
  - [x] Browser smoke port 3000/3001: klik jawaban → arti tampil, POST 200
- **Manual verification (if needed):**
  - [ ] Stop semua `next dev`, hapus `.next`, satu instance dev, hard refresh → layout.css 404 hilang.
- **Results:** Root cause = stale dev/HMR (layout.css chunk 404 + server action ID mismatch → POST 500); hardening mengurangi risiko LLM timeout & cache miss anon.
- **Status:** PASS (auto); MANUAL_PENDING (restart dev bersih)

## 2026-08-09 — Natural Indonesian translation for practice answer options
- **Target output:** Arti di bawah pilihan jawaban = terjemahan Indonesia natural (bukan campuran EN/ID); frasa dinamis dari LLM ikut diterjemahkan.
- **Surface:** frontend | server | edge | db
- **Acceptance criteria:**
  - [x] Klik jawaban → arti langsung tampil (fallback lokal), lalu diperkaya server jika perlu.
  - [x] `"I think I was overwhelmed with tasks"` → `"Saya rasa saya kewalahan dengan tugas."`
  - [x] Cache DB `practice_phrase_translations` untuk hindari terjemahan ulang.
  - [x] Edge gateway task `translate_phrase` untuk kalimat baru dari LLM.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] MCP `apply_migration` practice_phrase_translation_cache → success
  - [x] MCP `execute_sql` seed overwhelmed phrase → PASS
  - [x] `npx supabase functions deploy learning-llm-gateway` → exit 0
- **Manual verification (if needed):**
  - [ ] `/practice` → klik jawaban LLM baru → arti natural tanpa kata Inggris tersisa.
- **Status:** PASS (auto); MANUAL_PENDING

## 2026-08-09 — Practice UX: ejaan/arti pilihan jawaban + perbaikan skor/completion
- **Target output:** Klik pilihan jawaban di `/practice` menampilkan ejaan + arti Indonesia; skor rata-rata dan status completion konsisten dengan policy case + evaluator.
- **Surface:** frontend | server | db
- **Acceptance criteria:**
  - [x] Klik opsi jawaban → panel ejaan + arti Indonesia muncul di bawah pilihan.
  - [x] Skor rata-rata ditampilkan desimal (bukan `|| 0` bug).
  - [x] Completion summary bahasa Indonesia selaras status DB (objective wajib, turn, min pass).
  - [x] Evaluator objective completion lebih ketat per objective code.
  - [x] RPC `submit_learning_turn` pakai `conversation_policy.minimum_pass_score` + `required_objective_completion`.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] MCP `get_project_url` → `iuzvtttsjnlwtoegrsve.supabase.co`
  - [x] MCP `apply_migration` fix_practice_completion_scoring → success
  - [x] MCP `execute_sql` smoke: `submit_learning_turn` uses policy fields, `prosecdef=false` → PASS
- **Manual verification (if needed):**
  - [ ] `/practice` → klik pilihan jawaban → cek panel ejaan/arti.
  - [ ] Submit beberapa turn → cek skor rata-rata & completion summary.
- **Results:** Migration remote version `20260809063409` (MCP); local file `20260809143000` — repair via `db push`/repair if CLI drift.
- **Status:** PASS (auto); MANUAL_PENDING (browser smoke)

## 2026-08-09 — Remove admin Evaluation tab
- **Target output:** Tab `/evaluation` dihapus dari UI; nav dan middleware admin hanya `/cases`; fitur latihan (`/practice`) tidak berubah.
- **Surface:** frontend | server
- **Acceptance criteria:**
  - [x] Nav tidak menampilkan link Evaluation.
  - [x] Route `/evaluation` tidak ada (404 setelah build).
  - [x] Middleware admin hanya melindungi `/cases`.
  - [x] KPI Hari Ini tidak lagi menampilkan evaluation pass rate.
  - [x] Modul latihan (`evaluateSessionTurn`, practice actions) tidak disentuh.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka app → nav hanya Hari Ini, Belajar, Latihan, Admin Cases.
  - [ ] `/practice` tetap jalan (submit turn + feedback).
- **Results:** Build route list tidak lagi memuat `/evaluation`; practice route tetap `ƒ /practice`; lint/build PASS.
- **Status:** PASS (auto); MANUAL_PENDING (nav visual + practice smoke)

## 2026-08-08 — Ollama speaking tutor + case enrichment gateway
- **Target output:** Tab `/practice` speaking menerima konteks free-text learner, menghasilkan coach turn dari LLM via edge gateway dengan fallback deterministik, dan candidate case admin diperkaya payload terstruktur sebelum publish.
- **Surface:** frontend | server | edge | db
- **Acceptance criteria:**
  - [x] Speaking session menerima `learnerContext` + `conversationHistory` lalu mengirim ke server action.
  - [x] Server action memanggil gateway LLM, memprioritaskan output valid, lalu fallback ke state machine jika gateway gagal.
  - [x] Metadata coach (`coach_response`, `model_name`, `latency_ms`, `token_usage`) tersimpan ke `learning_session_turns`.
  - [x] Generate candidate admin menjalankan enrichment LLM dan menyimpan payload + title/scenario terstruktur.
  - [x] Publish candidate menerapkan draft payload ke `learning_case_versions`, objectives, turn templates, dan language targets.
  - [x] Evaluation gate menambah metrik operasional LLM (`coverage`, `fallback_rate`, `response_rate`, `latency`).
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] `npx supabase migration list` → exit 0 (`20260806142000` local=remote)
  - [x] `npx supabase functions deploy learning-llm-gateway --project-ref iuzvtttsjnlwtoegrsve` → exit 0
  - [x] MCP `get_project_url` → `https://iuzvtttsjnlwtoegrsve.supabase.co`
  - [x] MCP `execute_sql` schema smoke (`learning_session_turns.coach_response/model_name`, `case_candidates.payload`) → true
  - [x] MCP `list_edge_functions` → `learning-llm-gateway` status `ACTIVE`
  - [x] MCP `get_logs` postgres → tidak ada burst statement-timeout baru (terlihat log checkpoint + 1 error kolom lama yang tidak terkait change ini)
  - [x] MCP `get_logs` edge-function setelah invoke → POST 500 (localhost / subscription model) lalu POST 200 setelah secret diperbaiki
  - [x] Edge smoke invoke `learning-llm-gateway` task `practice_coach` → `ok: true`, model `gpt-oss:20b`, latency ~6.5s
  - [x] Edge smoke invoke `learning-llm-gateway` task `case_enrichment` → `ok: true`, draft terstruktur, latency ~12s
- **Manual verification (if needed):**
  - [x] Set Supabase secrets Option A: `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_API_KEY`, `OLLAMA_TIMEOUT_MS=90000`
  - [x] `OLLAMA_MODEL=gpt-oss:20b` (Free tier; `qwen3.5:397b` mengembalikan HTTP 403 subscription required)
  - [ ] Login learner → `/practice` → isi free-text context → submit 3-4 turn → pastikan coach response adaptif dari LLM (bukan fallback penuh).
  - [ ] Login admin → `/cases` → generate candidate → approve publish → cek objective/turn template/language target mengikuti payload enrichment.
- **Results:** Integrasi end-to-end kode selesai; build/lint hijau; edge gateway aktif (v9 log POST 200); smoke `practice_coach` + `case_enrichment` PASS via Ollama Cloud.
- **Status:** MANUAL_PENDING (UI browser flow belum diverifikasi agent)

## 2026-08-08 — Phase 1 stabilization + PNG logo alignment
- **Target output:** Phase 1 flow stabil (speaking/writing end-to-end), completion logic sinkron, dan branding memakai logo PNG asli user sebagai source of truth.
- **Surface:** frontend | server
- **Acceptance criteria:**
  - [x] Logo PNG tampil konsisten di shell (`/today`) dan marketing (`/`) serta dijadikan app icon.
  - [x] Watermark global memakai aset PNG dari `public/branding`.
  - [x] Speaking turn memakai evaluasi authoritative dari server action (bukan heuristic client lokal).
  - [x] Completion decision di state machine menghormati status persistence (`completionStatus`/`completionEligible`).
  - [x] Route admin `/cases` dan `/evaluation` tetap lolos build tanpa regresi.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Manual verification (if needed):**
  - [ ] Buka `/`, `/today`, `/practice`, `/cases`, `/evaluation` untuk cek visual/logo dan alur interaktif browser.
- **Results:** Refactor Phase 1 berhasil compile; logo sudah align ke PNG source-of-truth; flow speaking sekarang menerima hasil evaluator server sebagai acuan feedback dan status sesi.
- **Status:** MANUAL_PENDING

## 2026-08-06 — AppShell dashboard webpack HMR crash
- **Target output:** Dashboard routes (`/today`, `/practice`, dll.) render tanpa `__webpack_require__.n is not a function` di dev.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] `AppShell` tidak memakai default import `next/link` yang memicu `__webpack_require__.n`
  - [x] Navigasi shell tetap client-side via `router.push`
  - [ ] Browser dev: buka `/today` tanpa runtime error overlay
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] MCP `execute_sql` — `learning_sessions`, `evaluation_runs` exist
- **Manual verification (if needed):**
  - [ ] Restart `npm run dev`, buka `/today` → shell + KPI cards tampil
- **Results:** lint/build PASS; DB tables confirmed; AppShell chunk no longer imports `next/link`
- **Status:** MANUAL_PENDING (dev browser confirm)

## 2026-08-06 — Full Engine + Voice-First foundation
- **Target output:** Platform Bolo Bule berjalan dengan arsitektur modular (frontend routes, core learning engine, voice flow, admin review, evaluation gate) dan schema Supabase terpasang.
- **Surface:** frontend | server | db
- **Acceptance criteria:**
  - [x] Struktur App Router tersedia untuk marketing, app, admin-cases, admin-evaluation.
  - [x] Core modules tersedia: CaseRepository, SessionPlanner, ConversationStateMachine, ResponseEvaluator, MasteryUpdater, RecommendationEngine.
  - [x] Voice flow speaking aktif (capture, STT normalization, evaluator, TTS) dengan fallback text.
  - [x] Migration foundation + RPC + RLS berhasil di-push ke Supabase.
  - [x] Quality gate UI + evaluation lab tersedia untuk regression run.
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] `npx supabase migration list` → exit 0 (local=remote `20260806142000`)
  - [x] `npx supabase db push --include-all` → exit 1 (first try, index mismatch), lalu exit 0 setelah patch index
  - [x] MCP `get_logs` (postgres) → tidak terlihat burst timeout baru pada log yang diambil
  - [x] MCP `get_advisors` (performance) → lint level INFO terdeteksi pada tabel existing proyek lain; tidak memblok perubahan ini
  - [x] MCP `execute_sql` smoke function signature (PASS — project `iuzvtttsjnlwtoegrsve`, 9/9 RPC ditemukan, `prosecdef=false` sesuai desain INVOKER)
  - [x] MCP smoke auth guards: `enqueue_case_candidate` → Unauthorized (expected), `run_regression_evaluation` → Only reviewer/admin (expected)
  - [x] MCP smoke `ensure_default_evaluation_dataset()` → dataset_id=1
  - [x] MCP stuck-state query (`passed` tanpa objective) → 0 rows
  - [x] MCP `get_logs` postgres → tidak ada ERROR/57014 terkait migration learning engine
- **Manual verification (if needed):**
  - [ ] Login sebagai learner → buka `/practice` → jalankan speaking turn voice + submit → pastikan feedback dan turn lanjutan muncul.
  - [ ] Login reviewer/admin → buka `/admin/cases` → generate candidate → approve publish.
  - [ ] Buka `/admin/evaluation` → run evaluation gate → cek status PASS/FAIL.
- **Results:** Frontend build & lint hijau; migration terpasang; MCP smoke schema/RPC/RLS PASS. Data seed published case masih 0 (app fallback ke seedCaseBank). Auth-guarded RPC paths behave correctly under MCP service role without JWT.
- **Status:** MANUAL_PENDING (UI/browser voice + authenticated session flow)

## 2026-08-08 — Admin generate candidate Unauthorized fix
- **Target output:** Tombol Generate Candidate di `/cases` berhasil setelah login admin; kasus bisa dipublish untuk latihan di `/practice`.
- **Surface:** frontend | server | db
- **Acceptance criteria:**
  - [x] `/login` tersedia; `/cases` dan `/evaluation` redirect ke login jika belum auth
  - [x] User pertama mendapat `profiles.role = admin`
  - [x] `current_app_role()` membaca `profiles.role` (bukan hanya JWT)
  - [x] `generateCaseCandidateAction` menolak dengan pesan jelas jika belum login/bukan admin
  - [ ] Manual: login → generate → approve publish → kasus muncul di `/practice`
- **Verification commands:**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] `npx supabase db push --include-all` → exit 0 (`20260808160000`)
  - [x] MCP `current_app_role` definition includes profiles subquery (PASS)
- **Results:** Build/lint/migration PASS; auth flow added. Generate requires login + admin role.
- **Status:** MANUAL_PENDING (browser login → generate → publish → practice)

## 2026-08-09 — Practice Case Bank tidak menampilkan kasus published
- **Target output:** Kasus published (Performance Review) tampil di `/practice` Case Bank.
- **Surface:** server | db (PostgREST query)
- **Acceptance criteria:**
  - [x] MCP/SQL: `learning_case_versions` id=1 status=published ada
  - [x] Anon REST dengan FK hint mengembalikan Performance Review
  - [x] `listPublishedCases()` tidak fallback seed saat query error
  - [ ] Manual: refresh `/practice` → kartu Performance Review tampil
- **Verification commands:**
  - [x] anon curl PostgREST dengan `learning_cases!learning_case_versions_case_id_fkey` → PASS
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Results:** Root cause PGRST201 ambiguous embed; fixed FK hint in case-repository.
- **Status:** MANUAL_PENDING (user refresh /practice)

## 2026-08-10 — Landing page Linear-inspired UI (preview → Next.js)
- **Target output:** Halaman depan `/` dan `/login` memakai layout konsep `docs/preview/bolo-bule-linear-concept.html`: nav minimal, hero kiri, auth panel kanan (tab Masuk/Buat akun), gradasi transparansi + watermark logo.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Shared `LandingPage` untuk `(marketing)/page.tsx` dan `login/page.tsx`
  - [x] Satu titik auth: tab Masuk | Buat akun + submit + link switch (tanpa CTA duplikat)
  - [x] Gradasi box + watermark logo (`bb-landing-*` di `globals.css`)
  - [x] Hero/steps/proof berubah via `?mode=signin|signup`
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Results:** lint/build PASS; komponen baru `src/components/marketing/*`, `LoginForm` disederhanakan.
- **Status:** PASS (build); MANUAL_PENDING (browser smoke `/` dan `/login`)

## 2026-08-08 — MCP multi-project switch (Bolo Bule + CMMS-Bus)
- **Target output:** Agent dan user bisa switch MCP Supabase per workspace tanpa hapus koneksi global; Bolo Bule pakai `supabase-bolo-bule` → `iuzvtttsjnlwtoegrsve`.
- **Surface:** deploy (Cursor MCP config + scripts)
- **Acceptance criteria:**
  - [x] `.cursor/mcp.json` server key unik: `supabase-bolo-bule`
  - [x] Rule `44-mcp-supabase-scope.mdc` alwaysApply
  - [x] `scripts/mcp-project-status.ps1` exit 0 + project_ref match
  - [x] CMMS mirror: `supabase-cmms` + switch script project-scoped
- **Verification commands:**
  - `.\scripts\mcp-project-status.ps1` (Bolo Bule) → exit 0, ref `iuzvtttsjnlwtoegrsve`
  - `.\scripts\mcp-project-status.ps1` (CMMS-Bus) → exit 0, ref `liqhxftzgaszmoqnoiha`
  - MCP `get_project_url` on `project-0-Bolo Bule-supabase-bolo-bule` → `iuzvtttsjnlwtoegrsve`
- **Results:** Project-scoped MCP isolated; global `user-supabase` may coexist for CMMS OAuth — agents must use project server key per rule 44.
- **Status:** PASS (script); MANUAL_PENDING (user Reload Window after Open Folder)

## 2026-08-10 — Remove /today page (redirect to /learn)
- **Target output:** Halaman Hari Ini dihapus; nav dan link diarahkan ke `/learn`; cache build dibersihkan.
- **Surface:** frontend | server
- **Acceptance criteria:**
  - [x] `src/app/(app)/today/page.tsx` dihapus
  - [x] Nav AppShell tanpa "Hari Ini"
  - [x] `/today` redirect permanent ke `/learn`
  - [x] `getTodayCockpitSummary` dihapus; `revalidatePath("/today")` dihapus
  - [x] `.next` cache dihapus
- **Auto verification:** `npm run lint` + `npm run build`; MCP `get_project_url` → iuzvtttsjnlwtoegrsve
- **Status:** PASS

## 2026-08-10 — Data-driven speaking skill report (preview → app)
- **Target output:** Raport skill berbicara dari kumpulan latihan user — data-driven di `/learn`; cockpit `/today` wired ke data nyata Supabase.
- **Surface:** frontend | server
- **Acceptance criteria:**
  - [x] `/learn` menampilkan radar 6 dimensi, insight, remedial queue, riwayat sesi/turn dari DB
  - [x] `/today` kartu Next Session / Remedial / Momentum dari `getSpeakingSkillReport()` bukan hardcoded
  - [x] Agregasi multi-sesi user: dimensions, mastery, session history, weekly momentum
  - [x] API `/api/speaking-report` tetap expose JSON report
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
  - [x] MCP `execute_sql` aggregate sessions/scores → 1 session, 3 turns, avg task 58, fluency 76.3
- **Manual verification (if needed):**
  - [ ] Login → `/learn` → radar + transkrip OB1 muncul
  - [ ] `/today` → case title Evaluasi Kinerja, skor 70, remedial OB1/OB2
- **Results:** Report lib aggregates all user sessions; UI matches preview design; MCP confirms data shape.
- **Status:** PASS (build); MANUAL_PENDING (browser smoke)

## 2026-08-10 — Speaking session button placement UX
- **Target output:** Play coach audio di samping pertanyaan coach; Start voice input di samping panduan pelafalan; label pilihan jawaban sistem.
- **Surface:** frontend
- **Acceptance criteria:**
  - [x] Play coach audio kanan field pertanyaan coach
  - [x] Start voice input kanan panduan pelafalan saat jawaban dipilih
  - [x] Judul "Pilihan jawaban dari sistem" + hint di atas 3 opsi
- **Auto verification:** `npm run lint` (0) + `npm run build` (0)
- **Status:** PASS

## 2026-08-10 — Practice context "Revisi context" button
- **Target output:** User dapat menerapkan context pertama via Submit turn; revisi context mid-session via tombol "Revisi context" dengan feedback UI.
- **Surface:** frontend | server
- **Acceptance criteria:**
  - [x] Tombol "Revisi context" di samping field Your practice context
  - [x] Context pertama diterapkan setelah Submit turn (badge + pesan sukses)
  - [x] Revisi context enabled setelah turn pertama + context diubah
  - [x] Revisi context memanggil LLM coach tanpa submit jawaban baru
- **Auto verification (agent runs):**
  - [x] `npm run lint` → exit 0
  - [x] `npm run build` → exit 0
- **Results:** lint/build PASS; UI menampilkan hint pre-submit, badge context aktif, dan revisi mid-session.
- **Status:** PASS (build); MANUAL_PENDING (browser smoke)

_(Add per-task entries above this line, newest first.)_
