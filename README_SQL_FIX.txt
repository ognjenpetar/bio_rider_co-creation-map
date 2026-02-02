╔═══════════════════════════════════════════════════════════╗
║   VAŽNO - MORAŠ POKRENUTI SQL KOD U SUPABASE DASHBOARD   ║
╚═══════════════════════════════════════════════════════════╝

Aplikacija prikazuje 400 grešku jer MORAŠ POKRENUTI SQL kod u Supabase Dashboard-u.

═══════════════════════════════════════════════════════════
  KORACI (5 MINUTA):
═══════════════════════════════════════════════════════════

1. Otvori: https://supabase.com/dashboard

2. Otvori svoj projekat: bio-rider-co-creation-map

3. U levom meniju klikni: SQL Editor

4. Klikni: New Query

5. Kopiraj i PASTE-UJ ovaj kod:

───────────────────────────────────────────────────────────
-- QUICK FIX: Disable RLS and fix created_by type

ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_documents DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_created_by_fkey;
ALTER TABLE public.locations ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
───────────────────────────────────────────────────────────

6. Klikni: RUN (ili pritisni Ctrl+Enter)

7. Osvezi stranicu aplikacije (F5)

8. Testiranje - dodaj lokaciju

═══════════════════════════════════════════════════════════
  Sad bi trebalo da radi! ✅
═══════════════════════════════════════════════════════════

Za više detalja pogledaj:
- QUICK_FIX_400_ERROR.md
- SUPABASE_MIGRATION_INSTRUCTIONS.md
