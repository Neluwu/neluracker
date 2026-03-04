# Neluracker 🎬📚

Persönlicher Anime & Manga Tracker mit Echtzeit-Sync zwischen Handy und Laptop.

---

## Schritt 1 – Supabase einrichten (Datenbank, kostenlos)

1. Gehe zu **https://supabase.com** → kostenlos mit GitHub anmelden
2. **"New project"** → Name: `neluracker`, Region: `Central EU (Frankfurt)`
3. Warte ~1 Minute bis das Projekt bereit ist
4. Gehe zu **SQL Editor** (links in der Sidebar) und führe dieses SQL aus:

```sql
create table anime (
  id bigint primary key,
  title text,
  format text,
  eps int default 0,
  watched int default 0,
  status text,
  score int default 0,
  notes text,
  related jsonb
);

create table manga (
  id bigint primary key,
  title text,
  type text,
  chapters int default 0,
  volumes int default 0,
  read int default 0,
  "readVols" int default 0,
  status text,
  score int default 0,
  notes text,
  related jsonb
);

alter table anime enable row level security;
alter table manga enable row level security;
create policy "allow all" on anime for all using (true) with check (true);
create policy "allow all" on manga for all using (true) with check (true);
```

5. Gehe zu **Project Settings → API**:
   - Kopiere **Project URL** → das ist `VITE_SUPABASE_URL`
   - Kopiere **anon public** Key → das ist `VITE_SUPABASE_KEY`

---

## Schritt 2 – GitHub und Vercel

1. **GitHub**: Neues Repository `neluracker` erstellen, alle Dateien hochladen
2. **Vercel**: https://vercel.com → mit GitHub anmelden → `neluracker` deployen
3. In Vercel unter **Settings → Environment Variables** eintragen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
4. **Redeploy** klicken

---

## Fertig!

- Öffne die Vercel-URL auf Laptop und Handy
- Beim ersten Start werden alle 765 Einträge automatisch in Supabase hochgeladen
- Jede Änderung wird in ~1 Sekunde synchronisiert
- Statusanzeige im App-Header zeigt den Sync-Status an

---

## Lokale Entwicklung

```bash
cp .env.example .env.local
# Werte eintragen, dann:
npm install
npm run dev
```
