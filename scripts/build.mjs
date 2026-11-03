// Draait op Vercel bij elke build:
// 1. schrijft public/config.js met de publieke Supabase-gegevens (URL + publishable key)
// 2. maakt (idempotent) de tabel "marks" aan met beveiliging per gebruiker
import { writeFileSync } from 'node:fs';
const env = process.env;
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
writeFileSync('public/config.js', 'window.BOI_CONFIG=' + JSON.stringify(url && key ? { url, key } : {}) + ';\n');
console.log(url && key ? 'config.js: Supabase gevonden' : 'config.js: geen Supabase-gegevens, vinkjes blijven lokaal');

const db = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
if (!db) { console.log('Geen database-URL, migratie overgeslagen'); process.exit(0); }
const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: db.replace(/[?&]sslmode=[^&]*/, ''), ssl: { rejectUnauthorized: false } });
const SQL = `
create table if not exists public.marks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_key text not null check (char_length(place_key) <= 160),
  visited boolean not null default false,
  want boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, place_key)
);
alter table public.marks enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marks' and policyname='marks_select_own') then
    create policy marks_select_own on public.marks for select to authenticated using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marks' and policyname='marks_insert_own') then
    create policy marks_insert_own on public.marks for insert to authenticated with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marks' and policyname='marks_update_own') then
    create policy marks_update_own on public.marks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marks' and policyname='marks_delete_own') then
    create policy marks_delete_own on public.marks for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;
revoke all on public.marks from anon;
grant select, insert, update, delete on public.marks to authenticated;
`;
try {
  await client.connect();
  await client.query(SQL);
  const { rows } = await client.query("select count(*)::int as n from pg_policies where schemaname='public' and tablename='marks'");
  console.log('Database: tabel marks klaar, beveiligingsregels:', rows[0].n);
} catch (e) {
  console.error('Migratie mislukt:', e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
