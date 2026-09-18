# SiteMargin

Aplicație web pentru firme mici de renovări și construcții: evidența bugetului și a costurilor
pe fiecare lucrare, lucrări suplimentare aprobate de client prin link și urmărirea suplimentelor
aprobate dar încă nefacturate.

**Stadiu:** Etapa 2, schelet de proiect. Aplicația nu are încă funcții. Vezi `docs/progress.md`.

Ipoteza de pornire (nevalidată): firmele mici pierd evidența costurilor și a lucrărilor
suplimentare, ceea ce le reduce câștigul sau întârzie facturarea. Vezi `docs/plan.md`.

## Cum pornește local

Cerințe: Node.js 24 LTS și npm (vin împreună).

```bash
npm install
npm run dev
```

Deschide http://localhost:3000. Pagina se afișează în română.

## Comenzi utile

| Comandă              | Ce face                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `npm run dev`        | pornește aplicația local, cu reîncărcare automată                 |
| `npm run build`      | verifică și construiește versiunea de producție                   |
| `npm run lint`       | verifică stilul codului (ESLint)                                  |
| `npm run typecheck`  | verifică tipurile TypeScript                                      |
| `npm test`           | rulează testele unitare (Vitest) o singură dată                   |
| `npm run test:watch` | rulează testele unitare continuu, la fiecare modificare           |
| `npm run e2e`        | rulează testele în browser (Playwright); pornește singur serverul |
| `npm run format`     | formatează codul (Prettier)                                       |

## Tehnologii

Next.js 16 (App Router) + TypeScript, Tailwind CSS 4 + shadcn/ui, next-intl (română implicit,
structură pentru engleză și olandeză), Vitest, Playwright. Etapa pilot va adăuga Supabase
(PostgreSQL, autentificare, fișiere).

## Variabile de mediu

Copiază `.env.example` în `.env.local` și completează. `.env.local` nu se pune niciodată pe GitHub.

## Structura

```
app/            ecrane și layout (Next.js App Router)
components/ui/  componente shadcn/ui
i18n/           configurarea limbilor
messages/       traduceri: ro.json (principal), en.json, nl.json
lib/            funcții comune
e2e/            teste în browser
docs/           plan, progres, ghid de interviuri
```

## Documentație

- `docs/plan.md`: planul aprobat, decizii, formule, model de date, etape.
- `docs/progress.md`: ce funcționează, ce lipsește, următorul pas.
- `docs/interviuri.md`: ghid de discuție cu firme pentru validarea problemei.
- `CLAUDE.md`: reguli de lucru pentru asistentul AI.
