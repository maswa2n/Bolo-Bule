# Target Output Verification (Agent Gate)

Dokumen kanonik agar agent **menjalankan testing** berdasarkan output yang ditargetkan — bukan hanya menulis checklist.

**Enforcement:** `.cursor/rules/43-target-output-verification.mdc` (`alwaysApply: true`), `AGENTS.md` § TARGET OUTPUT VERIFICATION.

---

## Kapan gate wajib

| Jenis task | Gate |
|------------|------|
| Build / scaffold modul | Wajib |
| Bug fix / error fix | Wajib |
| Feature / logic change | Wajib |
| Docs-only (tanpa kode runtime) | Opsional |
| Pertanyaan / review saja (no code change) | Tidak perlu |

---

## Format Target Output

```markdown
## Target Output
- **Surface:** frontend | server | db | edge | deploy
- **Module/page:** <nama modul atau halaman>
- **Expected behavior:** <satu kalimat hasil yang diinginkan>
- **Acceptance criteria:**
  - [ ] <kriteria 1 — measurable>
  - [ ] <kriteria 2>
- **Auto verification:**
  - `npm run lint`
  - `npm run build`
- **Manual verification (jika perlu):**
  - Buka <halaman> → <aksi> → expect <hasil>
```

**Contoh — bug fix build:**

```markdown
## Target Output
- **Surface:** frontend
- **Module/page:** Home page
- **Expected behavior:** `npm run build` hijau tanpa error TS
- **Acceptance criteria:**
  - [ ] `npm run lint` exit 0
  - [ ] `npm run build` exit 0
```

**Contoh — RPC baru:**

```markdown
## Target Output
- **Surface:** db + server
- **Expected behavior:** RPC `get_foo_report` return baris dengan kolom expected
- **Acceptance criteria:**
  - [ ] MCP `execute_sql`: function exists, `prosecdef` sesuai desain
  - [ ] Smoke query → expected shape
  - [ ] `npm run lint` + `npm run build` PASS
```

---

## Matrix: perubahan → test otomatis minimum

| Perubahan | Auto-run wajib | Tambahan bila relevan |
|-----------|----------------|---------------------|
| `src/**` | `npm run lint`, `npm run build` | Unit test file terkait |
| `supabase/migrations/**` | `npx supabase migration list` (aligned) | MCP `execute_sql` smoke + wrapper check untuk heavy RPC |
| Rewrite hardened / state-transition RPC | `db push` + MCP smoke (Rule 32/43) | stuck-state per critical transition |
| `supabase/functions/**` | `npm run lint` + `npm run build` jika caller berubah | Deploy/smoke function |
| Cross-module (Rule 42) | Semua layer yang disentuh | Impact Report + Verification Report |

---

## Verification Report (wajib di akhir response agent)

```markdown
### Verification Report
- **Target:** <ringkas expected behavior>
- **Commands run:**
  - `npm run lint` → exit 0
  - `npm run build` → exit 0
- **Acceptance criteria:**
  - [x] Kriteria 1 — PASS
- **Status:** PASS | FAIL | MANUAL_PENDING
```

---

## Root scripts (repo truth)

```bash
npm run dev       # Next.js dev server
npm run lint      # ESLint
npm run build     # production build
npm run db:types  # regenerate Supabase types
```

---

## Anti-patterns (dilarang)

- Menulis checklist verify tanpa menjalankan command.
- Menutup task saat `npm run build` masih FAIL.
- Klaim "seharusnya OK" tanpa expected vs actual.
- Skip verifikasi modul konsumen saat Rule 42 terpicu.
