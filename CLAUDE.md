@AGENTS.md

# Reguli de lucru SiteMargin

## Înainte de orice

1. Citește `docs/progress.md` (stare reală) și `docs/plan.md` (decizii). Nu porni de la zero,
   nu rescrie componente funcționale fără motiv.
2. Verifică `git status` și rulează `npm run typecheck && npm test` ca să vezi starea reală.
3. Next.js 16 are diferențe față de versiunile vechi: citește ghidul potrivit din
   `node_modules/next/dist/docs/` înainte de a scrie cod nou (vezi AGENTS.md).

## Comunicare

- Română, simplă, concretă. Termenii tehnici se explică la prima apariție.
- Utilizatorul este începător: pentru pași manuali spune exact unde apasă, ce scrie, ce vede.
- Doar pașii etapei curente. La final de etapă: ce s-a realizat, ce s-a verificat, ce limitări
  există, care e următorul pas.

## Ce cere acord explicit

- Schimbări de scop, servicii plătite sau conturi noi, acțiuni distructive (ștergeri, force push),
  publicarea aplicației pe internet, începerea unei etape noi.
- Nu porni agenți paraleli fără acord.

## Cod

- Bani: întregi în unități minime (bani/cenți), niciodată zecimale flotante. Rotunjire „half up”
  o singură dată, la linie. Formulele sunt în `docs/plan.md`, secțiunea Formule.
- Nu numi diferența dintre valoare și costuri directe „profit net”; se numește „marjă directă”.
- Toate textele vizibile trec prin `messages/ro.json` (principal), cu chei identice în `en.json`
  și `nl.json`. Testul `i18n/messages.test.ts` verifică asta.
- Niciun buton care pare funcțional dar nu face nimic; ce nu e gata e dezactivat și marcat.
- Date fictive în demo și teste. Fără secrete, `.env`, parole sau date reale în repository.
- `.env.example` conține doar nume de variabile și valori demonstrative.

## Comenzi

```bash
npm run dev         # aplicația local
npm run typecheck   # tipuri TypeScript
npm run lint        # ESLint
npm test            # Vitest, o rulare
npm run e2e         # Playwright (pornește singur serverul)
npm run format      # Prettier
```

## Git

- `.gitignore` există; verifică `git status` și `git diff --cached` înainte de commit.
- Commit-uri pe etape funcționale, mesaje clare în română. Fără force push.
- Nu declara un test „trecut” dacă nu a fost rulat. Spune ce nu s-a putut verifica.
