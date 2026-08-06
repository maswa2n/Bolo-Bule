@echo off
REM Link Bolo Bule to Supabase project iuzvtttsjnlwtoegrsve
REM Requires: logged-in Supabase account with access to this project

echo Step 1: Login (opens browser)
call npx supabase login

echo Step 2: Link project
call npx supabase link --project-ref iuzvtttsjnlwtoegrsve

echo Done. Run: npm run db:types
