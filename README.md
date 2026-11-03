# Best of Ireland Kaart

Interactieve kaart met alle 535 plekken uit de directory van *Best of Ireland* (p. 212–217): categorieën, adressen, websites, Instagram, en vinkjes voor "Wil ik heen" en "Bezocht".

Live: https://ierland.baalhuis.net

## Hoe het werkt
- De kaart werkt zonder account.
- Vinkjes vragen om in te loggen met een e-mailcode van 6 cijfers (Supabase Auth). Ze worden per account opgeslagen in de tabel `marks`, beveiligd met row-level security: iedereen ziet en wijzigt alleen zijn eigen vinkjes.
- Gebruikers kunnen hun account zelf verwijderen (`/api/delete-account`).

## Mappen
| Pad | Wat |
|---|---|
| `public/` | De site zelf (HTML, CSS, JS, data, iconen, service worker) |
| `public/data/places.js` | De 535 plekken |
| `scripts/build.mjs` | Draait bij elke Vercel-build: schrijft `public/config.js` met de publieke Supabase-gegevens en maakt de tabel `marks` aan (idempotent) |
| `api/delete-account.js` | Serverfunctie om een account met alle vinkjes te verwijderen |
| `vercel.json` | Build-instellingen en cache-headers |

## Benodigde omgevingsvariabelen (gezet door de Supabase-koppeling in Vercel)
`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (of `..._ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL_NON_POOLING`.

## Supabase-instellingen (eenmalig, in het Supabase-dashboard)
- **Authentication → URL Configuration → Site URL:** `https://ierland.baalhuis.net`
- **Authentication → Emails → Magic Link** en **Confirm signup:** de mail moet de code bevatten via `{{ .Token }}`.

## Een plek aanpassen
Velden per plek in `public/data/places.js`: `n` naam, `t` plaats, `c` county, `k` categorie, `p` pagina, `la`/`lo` coördinaten, `a` adres, `x` = 1 als de locatie exact is, `w` website, `ig` Instagram, `fb` Facebook. Verhoog daarna het versienummer (`v=…`) in `public/index.html` en `public/sw.js`.
