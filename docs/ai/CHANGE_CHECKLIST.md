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

_(Add per-task entries above this line, newest first.)_
