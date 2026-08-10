# Mobile UX QA Matrix (Bolo Bule)

Checklist manual untuk validasi identitas visual + motion system setelah perubahan UI mobile.

**Viewport:** 360–430px (Chrome DevTools atau device nyata)  
**Prerequisite:** `npm run dev` + hard refresh

---

## Global (AppShell)

| Check | Expected | Route |
|-------|----------|-------|
| Header tidak overlap | Brand, nav, session/login stack rapi | `/today`, `/practice` |
| Nav tap feedback | Press depth terasa saat tap item nav | semua app route |
| Active nav state | Tab aktif gradient biru-cyan jelas | `/practice` vs `/today` |
| Reduced motion | Set OS "reduce motion" → animasi rise/pulse/sheen mati | any |

---

## Per halaman

### `/` (Marketing)

| State | Action | Expected |
|-------|--------|----------|
| Tap | CTA "Masuk ke Dashboard" | Press depth + navigasi ke `/today` |
| Tap | CTA "Mulai Latihan" | Ghost button press + ke `/practice` |
| Load | Buka halaman | Hero `bb-motion-rise` sekali (jika motion allowed) |

### `/login`

| State | Action | Expected |
|-------|--------|----------|
| Submit | Sign in invalid | Error banner `bb-state-error` + enter motion |
| Submit | Sign up success | Success banner `bb-celebrate-subtle` + mode switch signin |
| Submit | Sign in pending | Primary button pulse (`bb-motion-pulse`) |
| Tap | Toggle signin/signup | Secondary button press depth |

### `/today`

| State | Action | Expected |
|-------|--------|----------|
| Tap | "Lanjutkan latihan prioritas" | Secondary CTA press → `/practice` |
| Scroll | KPI cards | Glass panel + subtle lift on hover (desktop) |

### `/learn`

| State | Action | Expected |
|-------|--------|----------|
| View | Mastery bars | Progress fill + sheen animasi halus |
| Scroll | Table horizontal | Overflow scroll tanpa layout break |

### `/practice`

| State | Action | Expected |
|-------|--------|----------|
| Tap | Case card | Press depth + active border |
| Swipe | Case bank mobile | Horizontal snap scroll |
| Submit | Submit turn | Primary pulse saat processing |
| Success | Context applied | Green success state + subtle ring celebration |
| Error | Invalid submit | Red error banner enter |
| Progress | After several turns | Score/objective progress bars update |

### `/cases` (Admin)

| State | Action | Expected |
|-------|--------|----------|
| Submit | Generate candidate | Pulse + success/error semantic banner |
| Tap | Approve & Publish | Primary press depth |
| Success | Published badge | Badge celebrate subtle (ring) |

---

## Performance guardrails

- Tidak ada animasi infinite selain progress sheen (ringan, CSS-only).
- Tidak ada layout shift besar saat state message muncul.
- Tombol disabled tetap readable (opacity, bukan hilang).

---

## Sign-off template

```markdown
## Mobile UX QA — YYYY-MM-DD
- Tester:
- Device/viewport:
- Routes checked: /, /login, /today, /learn, /practice, /cases
- Reduced motion tested: yes/no
- Result: PASS | FAIL (notes)
```
