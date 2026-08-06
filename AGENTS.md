# AGENTS.md — Bolo Bule Guardrails (Next.js 15 + Supabase)

You are an agent working in this repo:
- App: `src/app/` (Next.js App Router)
- Lib: `src/lib/` (Supabase clients, shared utilities)
- Components: `src/components/`
- Types: `src/types/` (generated Supabase types)
- Supabase: `supabase/` (migrations, Edge Functions, config)
- Docs: `docs/` (incl. `docs/ai/*` knowledge base)

PRECEDENCE
- If `AGENTS.override.md` exists and is applicable to the current task (especially error-fixing),
  it takes precedence over this file.

PRIMARY GOAL
Deliver correct changes with minimal tokens and minimal churn. Prefer the smallest safe patch.

HARD OUTPUT RULE
- Default output MUST be `git diff` only. No explanations outside the diff.
- EXCEPTION: If STOP CONDITIONS are triggered, output ONLY the requested items (no diff).

========================================================
CONTROLLED DISCOVERY (ALLOWED, BOUNDED)
========================================================
You MAY search the repo (search/grep) to locate relevant files so the user does NOT need to provide file paths.
This is NOT a broad scan: it is targeted discovery with strict budgets.

Budgets (per fix attempt):
- Search operations (filename/content): max 12
- Files opened total: max 10
  - Code files max 7
  - Docs/ai files max 3 (when applicable)

Discovery rules:
- Prefer search/grep over opening files.
- Open only the top 1–3 candidate files from search results.
- When opening files, read only the relevant region.

Hard exclusions (NEVER open / NEVER rely on):
- `node_modules/**`, `.git/**`, `dist/**`, `build/**`, `.next/**`, `coverage/**`
- bundled/minified/generated artifacts
- secrets: `.env*`, `*.pem`, `*.key`, `id_rsa*`, any service-role keys

========================================================
PREFERRED SEARCH SCOPE (PRECISION FOR THIS REPO)
========================================================
Always prioritize searches in this exact order:

A) Data access layer first
1) `src/lib/**` (Supabase helpers, server actions, API utilities)
2) `src/app/**/actions.ts` (Server Actions)

B) UI trigger next (where call is initiated)
3) `src/app/**` (pages, layouts, route segments)
4) `src/components/**`

C) Supabase layer next (Edge / DB / RLS)
5) `supabase/functions/**` (Edge Functions)
6) `supabase/migrations/**` (SQL, RLS/policies)

D) Route handlers (when used)
7) `src/app/api/**` (Route Handlers)

E) Repo scripts/config only when proven relevant
8) `package.json` (scripts), `middleware.ts`, `next.config.ts`

========================================================
ANTI TRIAL-AND-ERROR (ONE ROOT CAUSE)
========================================================
- You MUST form exactly ONE root-cause hypothesis based on evidence from opened files.
- Implement ONE coherent fix path.
- Do NOT "try things".
- Do NOT add multiple alternative fixes.

If multiple plausible causes exist:
- Choose the single most evidence-supported cause.
- Do NOT patch others "just in case".

========================================================
PATCH CONSTRAINTS
========================================================
- Smallest safe patch only.
- Avoid refactors unless required for correctness.
- Never change unrelated formatting.
- Never edit generated/vendor/bundled artifacts.
- Do NOT add dependencies unless strictly required and justified by evidence.

ALLOWED EDIT AREAS (when evidence requires)
- `src/**`
- `supabase/functions/**`
- `supabase/migrations/**`
- `docs/ai/**` (knowledge base / checklists)
- `package.json`, `middleware.ts`, `next.config.ts` only when proven relevant

========================================================
DEFAULT WORKFLOW (STRICT)
========================================================
1) Identify failing surface (UI vs server vs db vs edge) from evidence.
2) Controlled discovery (search first) to locate likely files.
3) Open minimal files, form ONE evidence-backed hypothesis.
4) Patch minimal + **run** verification against target output (lint/build/runtime/MCP) — see § TARGET OUTPUT VERIFICATION.
5) If bug class could recur, update `docs/ai/*` (see below).

========================================================
TARGET OUTPUT VERIFICATION (MANDATORY BEFORE TASK DONE)
========================================================
Canonical: `docs/ai/TARGET_OUTPUT_VERIFICATION.md`, rule: `.cursor/rules/43-target-output-verification.mdc`.

Applies to: build/scaffold, problem solving, bug fix, feature/logic change, cross-module work.

1) **Define Target Output** (from user or derived from error evidence):
   - Surface, expected behavior, measurable acceptance criteria, verification commands.
2) **Execute verification in-repo** (terminal/MCP) — not documentation-only:
   - App: `npm run lint` + `npm run build`
   - SQL/RPC: MCP `execute_sql` smoke; heavy RPC → also Rule 41 + CHANGE_CHECKLIST § 522
3) **Compare actual vs expected** — task is NOT done on FAIL or missing critical consumer verification (Rule 42).
4) **Record** in `docs/ai/CHANGE_CHECKLIST.md` (§ Target Output Verification Gate) + Verification Report in final response.
5) Bug fixes: also `docs/ai/ERROR_FIX_LOG.md` + `ERROR_FIX_INDEX.json` with commands run and PASS/FAIL.

ROOT SCRIPTS (repo truth)
- `npm run dev`   (Next.js dev server)
- `npm run build` (production build)
- `npm run lint`  (ESLint via next lint)
- `npm run db:types` (regenerate Supabase TypeScript types)

========================================================
SUPABASE-FIRST DATA ACCESS (DEFAULT)
========================================================
Default application data backend is Supabase.

For ALL NEW modules/features and for refactors that touch data access:
- Prefer Supabase via `@supabase/ssr`:
  - Server Components / Server Actions: `src/lib/supabase/server.ts`
  - Client Components: `src/lib/supabase/client.ts`
- Data access patterns:
  1) Direct `supabase-js` queries in `src/lib/**` or Server Actions, OR
  2) Supabase RPC (`supabase.rpc`) / Edge Functions for privileged ops.
- Route Handlers (`src/app/api/**`) are NOT the default for new features.
  Use only when Next.js-specific behavior is required (webhooks, streaming, etc.).

Supabase 403 rule (critical):
- Assume RLS/policy issue until disproven.
- Fix via migrations/policies; NEVER add service-role keys to client-side code.

========================================================
NEXT.JS CONVENTIONS (App Router + TS)
========================================================
File types (mandatory for new code)
- Use **`.tsx`** for React (pages/components with JSX). Use **`.ts`** for everything else under `src/`.
- Do **not** create new **`.js`** files for application code under `src/`.

Server vs Client Components:
- Default to Server Components in `src/app/**`.
- Add `"use client"` only when hooks, browser APIs, or interactivity require it.
- Keep Supabase/DB calls in Server Components, Server Actions, or `src/lib/**` — not scattered in Client Components.

Middleware:
- Auth session refresh lives in `src/middleware.ts` + `src/lib/supabase/middleware.ts`.
- Do not duplicate auth logic elsewhere.

Async loading (Client Components):
- MUST use `try/catch/finally` to prevent infinite loading.

Types:
- Regenerate after schema changes: `npm run db:types`
- Import from `@/types/database.types`

========================================================
DOCS/AI UPDATES (WHEN APPLICABLE)
========================================================
- If fixing a bug/error: update `docs/ai/CHANGE_CHECKLIST.md` with exact verify commands/steps.
- If bug class could recur: log pattern in `docs/ai/*` following existing repo conventions.

========================================================
STOP CONDITIONS (NO FILE PATH REQUESTS)
========================================================
If you cannot form an evidence-backed hypothesis within the discovery budgets:
STOP and request exactly TWO things (no more):
1) Exact error evidence (stack trace OR network details: status + response snippet/headers)
2) Exact reproduction step (command OR page/action)

Do NOT ask the user for file paths.
Do NOT proceed with speculative changes.

========================================================
SUPABASE RPC FUNCTIONS (WHEN TO USE, WHEN NOT)
========================================================

Use Supabase RPC (`supabase.rpc`) when the logic is inherently "database logic" and must be a single source of truth:

✅ USE RPC WHEN:
- Complex filtering/join/aggregation across multiple tables
- Atomic transaction (all-or-nothing) across multiple inserts/updates
- Business rules close to data (must not be bypassable by another client)
- Reduce roundtrips (replace multiple queries with one DB call)

❌ AVOID RPC WHEN:
- Simple CRUD / simple filters via `supabase-js` without multiple roundtrips
- UI formatting / presentation-only logic
- External network calls (use Edge Functions)
- Logic still unstable and changing daily

IMPLEMENTATION RULES:
- RPC definitions must be versioned in `supabase/migrations/**` (no manual DB edits).
- Follow `.cursor/rules/32-supabase-migrations.mdc`.
- Default to `SECURITY INVOKER`; `SECURITY DEFINER` only with justification + RLS review.
- Do NOT change an existing RPC signature in-place if already used: create v2, migrate callers, deprecate old.
- Server-side code may call RPC; Client Components should call Server Actions that wrap RPC when RLS requires it.

========================================================
ANTI-522 / ANTI-DB-OVERLOAD (MANDATORY FOR NEW MODULES)
========================================================
Error 522 = Cloudflare origin timeout when Supabase Postgres/API cannot respond in time.

HARD RULES (all new modules / data-access refactors):
1) Heavy RPC guard — fleet-wide / unfiltered scans MUST NOT be callable without strong filter.
2) Frontend burst control — lazy load, dedup, no `Promise.all` fan-out for heavy RPC.
3) Pagination — explicit `.limit()` / `.range()` on all lists.
4) No retry storm — max 3 retries with backoff; do NOT retry on 4xx, RLS 403, or `57014`.
5) MCP validation gate before marking module done — see Rule 41 + CHANGE_CHECKLIST § 522.

Canonical rule: `.cursor/rules/41-prevent-supabase-522-overload.mdc`

========================================================
PRODUCTION VS LOCAL ISSUES (LESSONS LEARNED)
========================================================

1) RLS POLICY ISSUES (works locally, fails in production)
- Symptom: Supabase 403 or empty results in production despite data existing.
- Fix: Verify RLS policies and auth context match production.

2) ENVIRONMENT VARIABLES NOT SET IN PRODUCTION
- Symptom: `NEXT_PUBLIC_SUPABASE_URL` or anon key missing in Vercel/deploy.
- Fix: Ensure all required env vars are configured in deployment platform.

3) SERVER vs CLIENT SUPABASE CLIENT MIXUP
- Symptom: Auth session not persisted, cookies not set, hydration errors.
- Fix: Use `createClient()` from `server.ts` in Server Components/Actions; `client.ts` only in Client Components.

4) DATE CONVERSION ISSUES
- Symptom: `toISOString is not a function` or date comparison fails.
- Fix: `value instanceof Date ? value : new Date(value)` before Date methods.

5) COLUMN NAME MISMATCHES (camelCase vs snake_case)
- Symptom: `42703 undefined column` or undefined property access.
- Fix: Use snake_case matching DB schema; normalize at data layer boundary.

6) RPC FUNCTION VERIFICATION
- Symptom: `PGRST202` or function does not exist.
- Fix: Verify function exists in migrations; smoke-test with MCP `execute_sql`.

7) BROWSER CACHE (old bundle after deploy)
- Fix: Hard refresh after deploy; consider cache headers in `next.config.ts`.
