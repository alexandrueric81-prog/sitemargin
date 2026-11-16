# Progres SiteMargin

Actualizat: 2026-11-16

## Etapa curentă

Etapa 3 (demo locală), pasul 3.1 (tipuri, calcule pure, mașini de stări): finalizat 2026-11-16.
Verificat: typecheck, lint, 51 de teste Vitest (5 fișiere). Playwright și build-ul NU au fost
rulate din nou la 3.1 (nu s-a schimbat niciun ecran).

## Ce funcționează

- Aplicație Next.js 16 + TypeScript + Tailwind 4, pornește cu `npm run dev`.
- shadcn/ui inițializat (componenta Button).
- next-intl: română implicită, cookie `locale`, dicționare `messages/ro|en|nl.json`.
- Pagina de start în română, cu stadiul proiectului.
- Vitest configurat; test care verifică că en/nl au aceleași chei ca ro.
- Playwright configurat (desktop + mobil); test pe pagina de start.
- `lib/domain/` (fără ecrane încă, doar logică testată):
  - `money.ts`: bani ca întregi, rotunjire „half up” la linie, cost ore, linie de cost, TVA.
  - `types.ts`: tipurile din modelul de date (firmă, membri, tarife, clienți, lucrări, ore,
    costuri, suplimente cu versiuni și decizii, facturări, încasări).
  - `job-state.ts`: stările lucrării și trecerile permise.
  - `proposal-state.ts`: ciornă → trimisă → acceptată/respinsă/expirată/anulată; o singură
    decizie per versiune; o singură versiune „în vigoare”.
  - `calculations.ts`: tarif istoric, corectări, rezumatul lucrării (toate formulele din plan
    și indicatorii „estimare nesigură”).
- Documentație: README.md, CLAUDE.md, docs/plan.md, docs/interviuri.md.

## Ce lipsește (față de plan)

- Ecranele de produs: clienți, lucrări, ore, costuri, suplimente, pagina principală, export
  (logica de calcul există din 3.1; depozitul de date și ecranele vin în 3.2–3.4).
- Comutator de limbă (structura există, ecranul nu).
- Nicio salvare de date, nicio autentificare (vin în Etapa 3 demo, respectiv Etapa 4 pilot).

## Etape încheiate

- Etapa 0 (2026-09-19): Command Line Tools, Git 2.50.1, Node 24.21.0, npm 11.19.0,
  gh 2.101.0 conectat la GitHub (HTTPS).

## Următorul pas

Etapa 1 (validare) rulează în paralel: discuții cu 3–5 firme după `docs/interviuri.md`.
Pasul 3.2, după acordul utilizatorului: depozit („repository”) în memorie + date fictive
(2 firme, 4 clienți, 6 lucrări, ore/costuri/suplimente), cu `idempotency_key`.

## Decizii luate la 3.1 (de confirmat de utilizator)

- Orele se țin ca minute întregi (7,5 ore = 450), cantitățile ca miimi (2,5 = 2500), ca să nu
  apară zecimale flotante. În formulare utilizatorul va scrie tot „7,5”.
- „Finalizată” și „anulată” sunt stări finale: o lucrare finalizată nu se poate redeschide.
  Planul nu spune nimic despre redeschidere; dacă e nevoie, se adaugă o trecere „finalizată → activă”.
- „Supliment acceptat fără preț” = versiune în vigoare cu preț 0.
- Lucrare fără buget: bugetul rămas se afișează ca necunoscut, nu 0.

## Întrebări deschise (logică, nu cod)

- Marcajul „facturat” e pe supliment, nu pe versiune: dacă un supliment facturat primește apoi o
  versiune nouă mai scumpă, diferența nu apare la „aprobate nefacturate”. Rămâne vizibilă doar
  în „de facturat” pe lucrare.

## Limitări cunoscute

- Engleza și olandeza au doar cheile de pe pagina de start; traducerea completă e etapă separată.
- Fără găzduire pe internet; totul rulează local.
- Pe o copie proaspătă a proiectului, `npm run typecheck` dă eroarea „Cannot find name
  'LayoutProps'” până se rulează o dată `npx next typegen` (sau `npm run dev` / `npm run build`),
  care generează tipurile Next.js.
