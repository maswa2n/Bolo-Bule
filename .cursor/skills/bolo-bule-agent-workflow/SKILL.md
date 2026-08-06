---
name: bolo-bule-agent-workflow
description: >-
  Agent workflow guardrails for Bolo Bule (Next.js 15 + Supabase). Use when
  building features, fixing bugs, adding migrations, scaffolding pages, or any
  task that touches src/, supabase/, or docs/ai/. Enforces verification gates,
  knowledge loop, and Supabase-first patterns from AGENTS.md and .cursor/rules/.
---

# Bolo Bule Agent Workflow

Apply this skill for any implementation task in the Bolo Bule repo.

## Canonical sources (read when relevant)

| Source | Purpose |
|--------|---------|
| `AGENTS.md` | Agent guardrails, discovery budgets, Supabase-first rules |
| `.cursor/rules/*.mdc` | Cursor rules (alwaysApply + file-scoped) |
| `docs/ai/CHANGE_CHECKLIST.md` | Per-task verification + 522 gate |
| `docs/ai/TARGET_OUTPUT_VERIFICATION.md` | Verification report format |
| `docs/ai/GENERATOR_RULES.md` | Scaffold patterns for pages/actions/lib |
| `docs/ai/ERROR_FIX_LOG.md` | Bug fix history |

## Repo structure

```
src/app/          Next.js App Router (pages, layouts, actions)
src/lib/          Supabase clients + data access
src/components/   UI components
src/types/        database.types.ts (generated)
supabase/         migrations, edge functions, config
docs/ai/          agent knowledge base
```

## Workflow (mandatory)

1. **Target Output** — define expected behavior + acceptance criteria before or at start of implementation.
2. **Controlled discovery** — search first; max 12 searches, max 10 files opened (see `AGENTS.md`).
3. **One hypothesis** — one root cause, one fix path; no trial-and-error.
4. **Smallest patch** — edit only `src/**`, `supabase/**`, `docs/ai/**` unless proven necessary.
5. **Verify** — run `npm run lint` + `npm run build`; MCP smoke for SQL/RPC changes.
6. **Document** — update `CHANGE_CHECKLIST.md`; bug fixes also update `ERROR_FIX_LOG.md`.
7. **Report** — final response includes Verification Report (PASS/FAIL/MANUAL_PENDING).

## Supabase rules (critical)

- Server: `@/lib/supabase/server` — Server Components, Actions, Route Handlers
- Client: `@/lib/supabase/client` — Client Components only
- 403 → assume RLS until disproven; fix via migrations
- Never use service-role key in client bundle
- Migrations: follow Rule 32 (timestamp filename, idempotent SQL, `db push`)

## Key cursor rules by task

| Task | Rules |
|------|-------|
| New page/feature | 11-generator-frontend, 10-generator-server |
| Bug fix | 20-fix-errors, 43-target-output-verification |
| SQL/RPC migration | 32-supabase-migrations, 41-prevent-supabase-522-overload |
| Cross-module change | 42-cross-module-impact-gate |
| Automation/integration | 40-integration-automation |

## Scripts

```bash
npm run dev       # development
npm run lint      # ESLint
npm run build     # production build
npm run db:types  # regenerate Supabase types
```

## MCP

- Project ref: `iuzvtttsjnlwtoegrsve` (see `.cursor/mcp.json`)
- Use Supabase MCP for `execute_sql`, migration checks, logs, advisors
