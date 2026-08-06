# Generator Rules (Project-Specific)

Tujuan: scaffold modul yang konsisten dengan repo ini (Next.js 15 + Supabase SSR) dan meminimalkan bug berulang.

## Server-side pattern
- Server Actions: `src/app/<route>/actions.ts` dengan `"use server"`
- Shared data access: `src/lib/<module>.ts`
- Supabase client: `createClient()` from `@/lib/supabase/server`
- Validate inputs before DB calls; return `{ data }` or `{ error }`

## Frontend page pattern
- Default Server Component di `src/app/<route>/page.tsx`
- Client interactivity: `"use client"` components di `src/components/**`
- Data fetch di Server Component atau `src/lib/**` — bukan di Client Component
- Async Client Components wajib `try/catch/finally`

## NUMERIC/BigInt conversion (CRITICAL)
- Supabase NUMERIC bisa berupa string, empty string, null, atau undefined
- Normalisasi di `src/lib/**`:
  ```typescript
  const toNumberOrZero = (value: unknown): number => {
    if (value === null || value === undefined || value === "") return 0;
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return Number.isNaN(num) ? 0 : num;
  };
  ```

## Document Number / atomic sequences (when needed)
- Gunakan RPC dengan advisory lock untuk generate nomor dokumen atomically
- Jangan rely on read-then-write di application layer untuk nomor unik

## Prevention rule
Jika kamu memperbaiki bug yang seharusnya bisa dicegah dengan scaffold lebih baik:
- Update file ini + `CHANGE_CHECKLIST.md`
- Catat ringkasannya di `ERROR_FIX_LOG.md`

## Verification after scaffold (mandatory — Rule 43)
Setelah generate modul baru, agent wajib:
1. Definisikan **Target Output** di `docs/ai/CHANGE_CHECKLIST.md`.
2. Jalankan: `npm run lint` + `npm run build`.
3. Final response berisi Verification Report (PASS/FAIL).

Canonical: `docs/ai/TARGET_OUTPUT_VERIFICATION.md`, `.cursor/rules/43-target-output-verification.mdc`.
