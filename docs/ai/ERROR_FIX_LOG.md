# ERROR FIX LOG

_(Add entries newest first. Use template from Rule 02 / `.cursor/rules/02-knowledge-loop.mdc`.)_

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
