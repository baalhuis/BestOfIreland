# Best of Ireland Kaart

Interactieve kaart met alle 535 plekken uit de directory van *Best of Ireland* (p. 212–217), met categorieën, adressen, websites, Instagram en vinkjes voor "Wil ik heen" en "Bezocht".

Het is een statische site: geen build-stap, geen server-code, geen API-sleutels.

## Op Vercel zetten

**Via GitHub (aanrader, dan kun je later makkelijk aanpassen)**
1. Maak een nieuwe repository op GitHub en zet de inhoud van deze map erin (de bestanden zelf, niet de map eromheen).
2. Ga naar vercel.com → *Add New… → Project* → kies de repository.
3. Framework Preset: **Other**. Build Command en Output Directory leeg laten.
4. Klik op *Deploy*.

**Via de command line**
```bash
npm i -g vercel
cd best-of-ireland-webapp
vercel          # eerste keer: inloggen en project aanmaken
vercel --prod   # live zetten
```

## Op je telefoon als app
Open de Vercel-URL in Safari → deelknop → *Zet op beginscherm*. De app werkt dan schermvullend. De laatst bekeken kaartstukken blijven ook zonder internet beschikbaar.

## Vinkjes
De vinkjes worden bewaard op het apparaat waarop je ze zet (in de browser). Wil je ze naar een ander apparaat verhuizen: *Vinkjes exporteren* op het ene apparaat, en daar *Importeren* met dat bestand.

## Bestanden
| Bestand | Wat |
|---|---|
| `index.html` | De pagina |
| `app.js` | Alle logica (kaart, lijst, filters, vinkjes, locatie) |
| `style.css` | Opmaak, licht en donker thema |
| `data/places.js` | De plekken (wordt door de pagina geladen) |
| `data/places.json` | Dezelfde data, leesbaar, om zelf te bewerken |
| `sw.js` | Service worker voor offline gebruik en installatie |
| `vercel.json` | Cache-instellingen voor Vercel |
| `vendor/` | Leaflet 1.9.4 en Leaflet.markercluster 1.5.3 |

### Een plek aanpassen
Velden per plek in `data/places.js`: `n` naam, `t` plaats, `c` county, `k` categorie, `p` pagina in het boek, `la`/`lo` coördinaten, `a` adres, `x` = 1 als de locatie exact is, `w` website, `ig` Instagram, `fb` Facebook.
Pas je iets aan, verhoog dan in `index.html` en `sw.js` het versienummer (`v=2026-11-03-1`), zodat telefoons de nieuwe versie ophalen.

## Kaartondergrond
Esri (Wegenkaart, Topografisch, Satelliet, Donker) en OpenStreetMap, te kiezen rechtsboven. Geen sleutel nodig. Adressen en een deel van de websites komen uit OpenStreetMap (© OpenStreetMap-bijdragers).
