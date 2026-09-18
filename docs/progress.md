# Progres SiteMargin

Actualizat: 2026-09-19

## Etapa curentă

Etapa 2 (schelet de proiect): finalizată 2026-09-19. Verificat: typecheck, lint, 3 teste
Vitest, 2 teste Playwright (desktop + mobil), build de producție.

## Ce funcționează

- Aplicație Next.js 16 + TypeScript + Tailwind 4, pornește cu `npm run dev`.
- shadcn/ui inițializat (componenta Button).
- next-intl: română implicită, cookie `locale`, dicționare `messages/ro|en|nl.json`.
- Pagina de start în română, cu stadiul proiectului.
- Vitest configurat; test care verifică că en/nl au aceleași chei ca ro.
- Playwright configurat (desktop + mobil); test pe pagina de start.
- Documentație: README.md, CLAUDE.md, docs/plan.md, docs/interviuri.md.

## Ce lipsește (față de plan)

- Tot ce ține de produs: clienți, lucrări, ore, costuri, suplimente, pagina principală, export.
- Comutator de limbă (structura există, ecranul nu).
- Nicio salvare de date, nicio autentificare (vin în Etapa 3 demo, respectiv Etapa 4 pilot).

## Etape încheiate

- Etapa 0 (2026-09-19): Command Line Tools, Git 2.50.1, Node 24.21.0, npm 11.19.0,
  gh 2.101.0 conectat la GitHub (HTTPS).

## Următorul pas

Etapa 1 (validare) rulează în paralel: discuții cu 3–5 firme după `docs/interviuri.md`.
Etapa 3 (demo locală cu date fictive) începe după aprobarea utilizatorului:
3.1 tipuri, calcule pure și mașini de stări cu teste.

## Limitări cunoscute

- Engleza și olandeza au doar cheile de pe pagina de start; traducerea completă e etapă separată.
- Fără găzduire pe internet; totul rulează local.
