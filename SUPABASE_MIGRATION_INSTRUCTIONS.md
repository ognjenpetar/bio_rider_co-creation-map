# Supabase Migration Instructions

## Problem

Posle prelaska sa Google Auth na localStorage autentifikaciju, dolazi do greške 400 pri snimanju lokacija jer:

1. **RLS politike** zahtevaju `authenticated` korisnike (Supabase Auth), ali sada koristimo localStorage
2. **`created_by` polje** je definisano kao UUID (referenca na profiles tabelu), ali šaljemo username kao string

## Rešenje

Potrebno je pokrenuti SQL migracije u Supabase da bi omogućili anonimnim korisnicima pristup i promenili tip `created_by` polja.

## Korak po korak

### 1. Otvori Supabase Dashboard

Idi na [https://supabase.com/dashboard](https://supabase.com/dashboard) i otvori svoj projekat.

### 2. Otvori SQL Editor

U levom meniju klikni na **SQL Editor**.

### 3. Pokreni prvu migraciju - Allow Anonymous Access

Kopiraj i pokreni sledeći SQL kod:

```sql
-- Paste contents of: supabase/migrations/20240103000000_allow_anonymous_access.sql
```

**Ili** otvori fajl `supabase/migrations/20240103000000_allow_anonymous_access.sql`, kopiraj ceo sadržaj i paste-uj u SQL Editor, pa klikni **Run**.

### 4. Pokreni drugu migraciju - Change created_by to TEXT

Kopiraj i pokreni sledeći SQL kod:

```sql
-- Paste contents of: supabase/migrations/20240103000001_change_created_by_to_text.sql
```

**Ili** otvori fajl `supabase/migrations/20240103000001_change_created_by_to_text.sql`, kopiraj ceo sadržaj i paste-uj u SQL Editor, pa klikni **Run**.

### 5. Proveri Storage Buckets

U levom meniju idi na **Storage** i proveri da:

- `location-images` bucket je **public**
- `location-documents` bucket može biti **public** ili **private** (politike dozvoljavaju pristup)

### 6. Testiranje

1. Osvezi stranicu aplikacije
2. Uloguj se (upiši svoje ime)
3. Pokušaj da dodaš novu lokaciju
4. Greška 400 bi trebalo da nestane

## Šta ove migracije rade?

### Migracija 1: Allow Anonymous Access

- **Briše** stare RLS politike koje zahtevaju `authenticated` korisnike
- **Kreira** nove RLS politike koje dozvoljavaju `anon` i `authenticated` korisnicima pristup
- Omogućava:
  - Svima da čitaju lokacije
  - Svima da kreiraju lokacije
  - Svima da menjaju lokacije
  - Svima da brišu lokacije (admin provera na frontend-u)
- Ažurira storage policies za images i documents

### Migracija 2: Change created_by to TEXT

- **Menja tip** `created_by` polja sa `UUID` na `TEXT`
- **Briše** foreign key constraint ka `profiles` tabeli
- Omogućava čuvanje username-a umesto UUID-a

## Napomena o sigurnosti

Pošto koristimo localStorage autentifikaciju:
- Sve admin provere (brisanje, reset) se rade na **frontend** nivou
- Backend dozvoljava sve operacije
- Ovo je prihvatljivo za malu community aplikaciju kao što je Bio Rider Co-Creation Map
- Za produkcijsku aplikaciju sa većim brojem korisnika, preporučuje se:
  - Backend autentifikacija (JWT tokens)
  - Server-side validacija admin privilegija
  - Rate limiting

## Pomoć

Ako i dalje imaš problema:

1. Proveri browser konzolu (F12) za detaljnije error poruke
2. Proveri Supabase Logs u Dashboard-u (Logs → Query Performance)
3. Proveri da li si pokrenuo obe migracije
4. Proveri da li je VITE_SUPABASE_ANON_KEY pravilno konfigurisan u `.env` fajlu
