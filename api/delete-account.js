// Verwijdert het account van de ingelogde gebruiker (en daarmee via "on delete cascade" al zijn vinkjes).
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Alleen POST' }); return; }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!url || !service || !token) { res.status(400).json({ error: 'Niet ingelogd of niet ingesteld' }); return; }
  const who = await fetch(url + '/auth/v1/user', { headers: { apikey: service, Authorization: 'Bearer ' + token } });
  if (!who.ok) { res.status(401).json({ error: 'Sessie ongeldig' }); return; }
  const { id } = await who.json();
  const del = await fetch(url + '/auth/v1/admin/users/' + id, { method: 'DELETE', headers: { apikey: service, Authorization: 'Bearer ' + service } });
  if (!del.ok) { res.status(500).json({ error: 'Verwijderen mislukt' }); return; }
  res.status(200).json({ ok: true });
}
