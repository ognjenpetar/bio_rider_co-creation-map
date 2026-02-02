# BRZO REŠENJE - 400 Error Fix

## Problem
Aplikacija prikazuje **400 Bad Request** grešku kada pokušaš da snimiš lokaciju.

## Najbrže rešenje (5 minuta)

### Korak 1: Otvori Supabase Dashboard
1. Idi na https://supabase.com/dashboard
2. Otvori svoj projekat: **bio-rider-co-creation-map**
3. U levom meniju klikni na **SQL Editor**

### Korak 2: Kopiraj i pokreni ovaj SQL kod

Klikni na **New Query**, zatim kopiraj i paste-uj sledeći kod:

```sql
-- QUICK FIX: Disable RLS and fix created_by type

-- 1. Disable RLS (najbrže rešenje)
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_documents DISABLE ROW LEVEL SECURITY;

-- 2. Fix created_by field type
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS locations_created_by_fkey;

ALTER TABLE public.locations
ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Done! Application should work now
```

### Korak 3: Klikni **RUN** (Ctrl+Enter)

### Korak 4: Testiranje
1. Osvezi stranicu aplikacije (F5)
2. Uloguj se
3. Pokušaj ponovo da dodaš lokaciju
4. Greška bi trebalo da nestane! ✅

---

## Šta ovaj SQL radi?

1. **DISABLE RLS**: Isključuje Row Level Security na tabelama
   - Supabase više neće blokirati anonimne korisnike
   - Sve operacije (insert, update, delete) će raditi

2. **Fix created_by**: Menja tip polja sa UUID na TEXT
   - Omogućava čuvanje username-a umesto user ID-a

---

## Alternativno rešenje (sa boljom bezbednošću)

Ako želiš bolje kontrolisanu sigurnost umesto potpunog isključivanja RLS:

### Opcija A: Pokreni 2 kompletnija fajla

1. Otvori i pokreni: `supabase/migrations/20240103000000_allow_anonymous_access.sql`
2. Otvori i pokreni: `supabase/migrations/20240103000001_change_created_by_to_text.sql`

### Opcija B: Pokreni 1 fajl sa svim fix-evima

Otvori i pokreni: `supabase/migrations/20240103000002_disable_rls_quick_fix.sql`

---

## Još uvek ne radi?

1. **Proveri konzolu**
   - Pritisni F12 u browseru
   - Idi na **Console** tab
   - Kopiraj kompletnu error poruku

2. **Proveri Supabase Logs**
   - Idi na **Logs** → **Postgres Logs** u Supabase Dashboard
   - Vidi da li ima više detalja o grešci

3. **Proveri .env fajl**
   ```
   VITE_SUPABASE_URL=https://emqipeszsgxvwzazuzyc.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Proveri Storage Buckets**
   - Idi na **Storage** u Supabase Dashboard
   - Proveri da `location-images` bucket postoji
   - Proveri da `location-documents` bucket postoji
   - Obadva bucketa mogu biti **public**
