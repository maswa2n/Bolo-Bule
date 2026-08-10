# Bolo Bule

Next.js 15 + Supabase starter.

Proyek terhubung ke:

| Layanan | Detail |
|---------|--------|
| **GitHub** | [maswa2n/Bolo-Bule](https://github.com/maswa2n/Bolo-Bule) |
| **Supabase** | [iuzvtttsjnlwtoegrsve](https://supabase.com/dashboard/project/iuzvtttsjnlwtoegrsve) |
| **API URL** | `https://iuzvtttsjnlwtoegrsve.supabase.co` |

## Quick start

```powershell
npm install
copy .env.example .env.local
# isi API keys dari dashboard Supabase
npm run dev
```

## Setup lokal

### 1. Environment variables

```powershell
copy .env.example .env.local
```

Isi kunci API dari [Supabase → Settings → API](https://supabase.com/dashboard/project/iuzvtttsjnlwtoegrsve/settings/api).

### 2. Supabase CLI (opsional, untuk migrasi lokal)

```powershell
npm install -g supabase
cd "d:\Bolo Bule"
supabase login
supabase link --project-ref iuzvtttsjnlwtoegrsve
```

### 3. Hubungkan GitHub ↔ Supabase

Di dashboard Supabase:

1. Buka [Integrations](https://supabase.com/dashboard/project/iuzvtttsjnlwtoegrsve/settings/integrations)
2. **GitHub Integration** → Authorize GitHub
3. Pilih repo **maswa2n/Bolo-Bule**
4. **Working directory**: `.` (karena folder `supabase/` ada di root repo)
5. Enable integration (opsional: Deploy to production)

Dokumentasi: [Supabase GitHub Integration](https://supabase.com/docs/guides/deployment/branching/github-integration)

### 4. Push ke GitHub

```powershell
git add .
git commit -m "chore: initial Supabase + GitHub setup"
git push -u origin main
```

## Cursor agent setup

Konfigurasi agent diadaptasi dari project CMMS-Bus:

| File | Fungsi |
|------|--------|
| `AGENTS.md` | Agent guardrails (discovery, Supabase-first, verification) |
| `.cursor/rules/*.mdc` | Cursor rules (core, generator, migrations, 522 prevention, dll.) |
| `.cursor/skills/bolo-bule-agent-workflow/` | Project skill — workflow agent untuk repo ini |
| `docs/ai/` | Knowledge base (checklist, error log, generator rules) |

## Cursor MCP

Server MCP khusus workspace: **`supabase-bolo-bule`** → project **iuzvtttsjnlwtoegrsve**.

### Pindah dari CMMS-Bus (atau project lain)

```powershell
# 1. File -> Open Folder -> D:\Bolo Bule
# 2. Ctrl+Shift+P -> Developer: Reload Window
cd "D:\Bolo Bule"
.\scripts\mcp-project-status.ps1
```

Verifikasi di chat: agent harus memakai MCP **`supabase-bolo-bule`** (bukan `user-supabase`) dan `get_project_url` → `iuzvtttsjnlwtoegrsve.supabase.co`.

| File | Fungsi |
|------|--------|
| `.cursor/mcp.json` | MCP server `supabase-bolo-bule` |
| `.cursor/mcp-project.meta.json` | Project ref + petunjuk switch |
| `.cursor/rules/44-mcp-supabase-scope.mdc` | Agent wajib pakai server project |
| `scripts/mcp-project-status.ps1` | Cek MCP sebelum kerja DB/RPC |
