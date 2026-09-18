# SiteMargin – plan de lucru

## Context

SiteMargin: aplicație web cu abonament pentru firme mici de renovări și construcții.
Ipoteză de pornire (NEVALIDATĂ, nu promitem venituri): firmele pierd evidența costurilor
și a lucrărilor suplimentare, ceea ce le reduce câștigul sau întârzie facturarea.
Aplicația trebuie să răspundă la trei întrebări: ce buget și costuri are fiecare lucrare,
ce suplimente a acceptat clientul, ce suplimente aprobate nu au fost încă facturate.

Utilizatorul este începător, lucrează pe Mac în Claude Code Desktop, folosește AI pentru a
construi. Funcțiile de bază NU depind de API-uri AI. Creditele se folosesc eficient: fără
agenți paraleli, fără analize nesfârșite, etape mici.

## Stare inițială (verificată 2026-09-18, fără modificări)

- Folder `/Users/dariabutoi/sitemargin`: gol, fără `.git`.
- GitHub `alexandrueric81-prog/sitemargin`: există, public, gol, branch `main`. Neconectat local.
- Mac (macOS 26.5.1): Command Line Tools LIPSESC (deci `git` nu rulează), lipsesc node, npm,
  brew, gh, supabase CLI, vercel CLI. Fără `~/.ssh`.
- Nu s-a putut verifica: conturi Supabase/Vercel, configurarea Git globală.

## Răspunsurile utilizatorului și ipotezele temporare

| Întrebare     | Răspuns                                       | Decizie în plan                                                                                                                                                                                                                              |
| ------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Țara          | nu știe încă                                  | **IPOTEZĂ TEMPORARĂ: România** (firmele de test sunt în România). Moneda și TVA se configurează per firmă, ca schimbarea țării să nu ceară rescriere.                                                                                        |
| Limba         | română, engleză, olandeză                     | Arhitectură multilingvă de la început (toate textele în dicționare, fără text „bătut în cuie” în ecrane). **Textele se scriu întâi în română.** Engleza și olandeza se adaugă ca etape de traducere, înainte de pilot în piețele respective. |
| Firme         | meseriași 2–3 oameni, firme mici, firme medii | **V1 țintește 1–10 oameni.** Firmele medii (10–30) vin după pilot: au nevoie de calendar, subcontractori avansați, mai multe roluri.                                                                                                         |
| Firme de test | 1–2, în România, română                       | Suficient pentru interviuri; mai găsim 2–3 (recomandări de la cele două, grupuri locale).                                                                                                                                                    |
| Buget lunar   | nu știe încă                                  | **IPOTEZĂ DE LUCRU, NU BUGET APROBAT: 0–25 EUR/lună.** Demo și dezvoltare = 0 EUR. Înainte de pilotul cu firme reale se prezintă o decizie de cost separată (vezi Costuri). Nu se activează nimic plătit fără acord explicit.                |

## Verificarea ideii (Etapa 1, în paralel cu pregătirea tehnică)

Scop: 3–5 discuții de 20–30 min cu firme, pornind de la ultimele lor 2–3 lucrări.
Utilizatorul le face personal; Claude pregătește ghidul și fișa de notare în `docs/interviuri.md`.

Ghid de discuție (întrebări, nu prezentare de produs):

1. Povestește-mi ultima lucrare terminată: cât ai ofertat, cât te-a costat, cât ai câștigat? De unde știi?
2. Cum ții evidența orelor și materialelor acum (caiet, Excel, WhatsApp, poze la bonuri, nimic)?
3. Când clientul a cerut ceva în plus, cum ai stabilit prețul și cum a acceptat (verbal, mesaj, hârtie)?
4. Ți s-a întâmplat să uiți să facturezi ceva ce ai lucrat în plus? Cât de des? Cât te-a costat?
5. Când afli că o lucrare a ieșit în pierdere: în timpul ei sau la final?
6. Ce ai încercat până acum și de ce ai renunțat?
7. Dacă ai avea un ecran pe telefon unde muncitorii pun orele și pozele la bonuri, ar face-o? Ce i-ar opri?
8. (Doar la final) Dacă ar exista așa ceva la X lei/lună, ai testa 2 săptămâni pe o lucrare reală?

Semnale de interes real vs. politețe:

- Politețe: „sună bine”, „ar fi util”, „când e gata să îmi spui”.
- Real: descrie o pierdere concretă cu sumă; întreabă când poate încerca; acceptă o dată pentru pilot;
  spune ce l-ar face să plătească; oferă contactul unui coleg.
  Criteriu de continuare: minimum 2 firme din 3–5 descriu problema cu exemple concrete și acceptă un pilot.
  Dacă nu: oprim înainte de Etapa B și regândim (nu înainte de demo, care e ieftină și utilă la interviuri).

## Scopul primei versiuni (V1 = demo + pilot)

Traseu complet obligatoriu:
adaug clientul → creez lucrarea și bugetul → înregistrez ore și materiale → propun un supliment →
clientul acceptă/respinge prin link → văd costuri vs. buget și suplimentele aprobate nefacturate.

În V1: cont firmă, membri cu 3 roluri, clienți, lucrări, ore, materiale, alte costuri directe,
subcontractori (ca linie de cost simplă), bonuri/poze, suplimente cu stări și versiuni, link de
răspuns pentru client, pagina principală, marcare „facturat” pe supliment, export CSV.
NU în V1: facturare propriu-zisă, devize, calendar, stocuri, portal client, notificări, offline,
plăți automate, AI. Vezi lista „Pentru mai târziu”.

## Etapa A (demo) vs. Etapa B (pilot)

**Etapa A – demo locală.** Rulează pe Mac-ul utilizatorului la `http://localhost:3000`.
Date fictive generate din fișiere de „seed” (date de pornire). Fără autentificare, fără server de
date: un „depozit” în memorie salvat în browser (localStorage) doar ca să supraviețuiască reîncărcării.
Banner vizibil „DEMO – date fictive, nesalvate pe server”. Scop: verificarea ecranelor și a
modului de lucru la interviuri. NU e produs pentru clienți reali.

**Etapa B – pilot.** Supabase: autentificare, PostgreSQL, fișiere. Separarea firmelor prin RLS
(Row Level Security = reguli în baza de date care decid ce rânduri vede fiecare utilizator),
permisiuni pe server, linkuri de aprobare sigure, migrații versionate, verificări înainte de date reale.

Refolosire fără complicare: aplicația vorbește cu datele printr-un singur strat („repository”)
cu o interfață clară (ex. `jobsRepo.list()`, `proposalsRepo.accept()`). În A implementarea e în
memorie; în B implementarea e Supabase. Ecranele, componentele, calculele și mașinile de stări
(ce tranziții sunt permise) rămân aceleași și sunt testate deja din A.

## Formule (definite înainte de implementare)

Per lucrare, toate în bani (unități minime, întregi: bani/cenți), fără zecimale flotante.
Toate sumele de mai jos numără DOAR înregistrările valabile (necorectate, nearhivate).

Valoare și buget:

- `valoare_contractata` = valoare convenită inițial + suma prețurilor din versiunile de supliment
  aflate în vigoare (o singură versiune per supliment; vezi „Modificarea unui supliment acceptat”).
- `buget_cost` = bugetul de costuri introdus la creare + efectul asupra bugetului (`efect_buget`)
  al versiunilor de supliment în vigoare, dacă a fost completat.

Costuri:

- `cost_inregistrat` = ore × tarif orar copiat la data înregistrării + materiale (cantitate × preț
  unitar la introducere) + alte costuri directe + subcontractori.
- `buget_ramas` = max(0, buget_cost − cost_inregistrat). Este DOAR „cât din buget mai e disponibil”,
  nu o estimare a ce urmează să coste.
- `cost_estimat_ramas` = introdus/actualizat manual de owner/manager (câmp separat, cu data
  actualizării). Dacă lipsește: se afișează „estimare incompletă”, NICIODATĂ 0. La stare
  finalizată/anulată se consideră 0.

Marje (toate etichetate „marjă directă”, niciodată „profit net”):

- `marja_directa_provizorie` = valoare_contractata − cost_inregistrat. Afișată doar cu eticheta
  „provizorie, lucrare neterminată”.
- `marja_directa_estimata_final` = valoare_contractata − cost_inregistrat − cost_estimat_ramas.
  Se calculează DOAR când cost_estimat_ramas este cunoscut; altfel „estimare incompletă”.
- `marja_directa_finala` = valoare_contractata − cost_inregistrat, DOAR când starea = finalizată.

Facturat și încasat (manual în V1, fără a genera facturi):

- `facturat` = suma înregistrărilor manuale „am facturat X la data Y, referință Z” pe lucrare.
- `incasat` = suma înregistrărilor manuale „am încasat X la data Y” pe lucrare.
- `de_facturat` = valoare_contractata − facturat; `de_incasat` = facturat − incasat.
- `suplimente_aprobate_nefacturate` = suma versiunilor de supliment în vigoare fără marcaj de facturare.

Modificarea unui supliment acceptat (regulă strictă, testată):

- Un supliment are mai multe versiuni; exact UNA poate fi „în vigoare” la un moment dat.
- Versiunea acceptată rămâne în vigoare până când o versiune NOUĂ este acceptată; abia atunci noua
  versiune o înlocuiește în `valoare_contractata` și `buget_cost`. Niciodată nu se adună două
  versiuni ale aceluiași supliment.
- O versiune nouă respinsă sau expirată lasă versiunea veche în vigoare.
- Fiecare link este legat de o versiune precisă (nu de supliment). Trimiterea unei versiuni noi
  revocă automat linkurile versiunilor anterioare.
- O versiune primește o singură decizie (constrângere unică în DB pe `version_id`). A doua apăsare
  sau o decizie contradictorie ulterioară primesc „Această propunere a fost deja decisă la data X”.
- Versiunile trimise sunt imuabile; orice modificare = versiune nouă, în stare ciornă, apoi trimisă.

Reguli:

- Nu folosim niciodată „profit net”. Textul din aplicație: „Marjă directă (nu include salarii
  indirecte, chirie, unelte, transport, taxe, timpul de administrare)”.
- Indicatori „estimare nesigură”: lucrare fără buget; ore fără tarif; materiale fără preț; lucrare
  în desfășurare fără costuri de peste 7 zile; supliment acceptat fără preț.
- Rotunjire: calcul în întregi; înmulțirile (ore zecimale × tarif) se rotunjesc la ban „half up”
  o singură dată, la linie, nu la total.
- O monedă per firmă (RON implicit pentru ipoteza România; EUR selectabil). Sumele se introduc
  FĂRĂ TVA; firma setează cota TVA implicită; suplimentul afișează clientului „preț fără TVA + TVA
  X% = total”, cota fiind salvată pe versiunea propunerii. Cota exactă se verifică la implementare
  din sursă oficială, nu din memorie.
- Tarife istorice: fiecare înregistrare de ore copiază tariful valabil la data ei; schimbarea
  tarifului unui membru nu modifică înregistrările vechi.
- Corectări: o înregistrare corectată nu se editează pe loc; se creează un rând nou care o
  înlocuiește (`inlocuieste_id`), iar rândul vechi primește `inlocuit_de_id`. Calculele numără doar
  rândurile cu `inlocuit_de_id IS NULL` și `arhivat_la IS NULL`. Istoricul rămâne vizibil.
- Fără duplicate: fiecare formular trimite un `idempotency_key` (identificator unic generat la
  deschiderea formularului); a doua apăsare sau reîncercarea de rețea nu creează al doilea rând.
- Acceptarea prin link = „acceptare înregistrată electronic (dată, oră, IP, versiune)”; nu o
  numim semnătură electronică calificată.

## Model de date (Etapa B; în Etapa A aceleași tipuri TypeScript)

Toate tabelele au `company_id`. Coloanele de corectare/arhivare: `inlocuieste_id`, `inlocuit_de_id`,
`arhivat_la` pe ore, costuri, facturări, încasări.

- `companies` (id, nume, monedă, cotă TVA implicită, țară, limbă implicită)
- `members` (company_id, user_id, rol: owner|manager|worker, status activ/eliminat, eliminat_la)
- `member_rates` (company_id, member_id, tarif_orar, valabil_de_la) — FINANCIAR, doar owner/manager
- `clients` (company_id, nume, contact, adresă, observații, arhivat_la)
- `jobs` (company_id, client_id, adresă, descriere, responsabil_member_id, data_start, data_estimat_final,
  stare: planned|active|paused|done|cancelled, arhivat_la) — fără sume
- `job_financials` (company_id, job_id, valoare_convenita, buget_cost, cost_estimat_ramas NULL-abil,
  cost_estimat_ramas_actualizat_la, actualizat_de) — FINANCIAR, doar owner/manager
- `job_members` (company_id, job_id, member_id)
- `time_entries` (company_id, job_id, member_id, dată, ore, notă, idempotency_key, inlocuieste_id,
  inlocuit_de_id, arhivat_la) — fără tarif
- `time_entry_costs` (company_id, time_entry_id, tarif_copiat, suma) — FINANCIAR, doar owner/manager;
  se scrie pe server la crearea înregistrării, din tariful valabil la data ei
- `cost_entries` (company_id, job_id, tip: material|other|subcontractor, descriere, cantitate,
  preț_unitar, total, dată, furnizor, introdus_de, idempotency_key, inlocuieste_id, inlocuit_de_id,
  arhivat_la) — worker-ul vede doar rândurile introduse de el
- `attachments` (company_id, job_id, time_entry_id|cost_entry_id opțional, cale storage, tip, mărime, introdus_de)
- `proposals` (company_id, job_id, stare curentă derivată din versiuni, versiune_in_vigoare_id NULL-abil)
- `proposal_versions` (company_id, proposal_id, nr_versiune, descriere, preț_fără_TVA, cotă_TVA,
  efect_termen_zile, efect_buget NULL-abil, stare: draft|sent|accepted|rejected|expired|cancelled,
  trimis_la, expiră_la; imuabile după trimitere)
- `proposal_decisions` (company_id, version_id UNIQUE, decizie: accepted|rejected, decis_la, ip,
  nume_client_introdus) — o singură decizie per versiune, impusă în DB
- `proposal_links` (company_id, version_id, token_hash, expiră_la, revocat_la, deschis_prima_data_la)
- `proposal_invoicing` (company_id, proposal_id, facturat_la, referință text liber)
- `job_invoices` (company_id, job_id, suma, data, referință text liber, inlocuit_de_id, arhivat_la) — manual
- `job_payments` (company_id, job_id, suma, data, notă, inlocuit_de_id, arhivat_la) — manual
- `audit_log` (company_id, entitate, id, acțiune, de_cine, când, diff)

Integritatea relațiilor între firme (impusă în DB, nu doar în cod):

- Fiecare tabel copil are `company_id` și chei străine COMPUSE: ex. `jobs(client_id, company_id)`
  → `clients(id, company_id)`; `time_entries(job_id, company_id)` → `jobs(id, company_id)`;
  `job_members(member_id, company_id)` → `members(id, company_id)`. Astfel o lucrare nu poate
  folosi clientul altei firme, iar o înregistrare nu poate fi legată de lucrarea altei firme,
  chiar dacă cineva trimite id-uri străine.
- Serverul (Server Actions) primește `company_id` din sesiune, niciodată din formular, și îl
  scrie el pe fiecare rând. Test automat: inserare cu id-uri încrucișate → refuzată de DB.

Reguli de acces (RLS + verificări pe server):

- Politica de bază pe fiecare tabel: rândul e vizibil doar membrilor activi ai `company_id`.
- Tabelele FINANCIARE (`member_rates`, `time_entry_costs`, `job_financials`, `proposal_*`,
  `job_invoices`, `job_payments`) au politici RLS suplimentare: SELECT/INSERT/UPDATE doar pentru
  rolurile owner|manager. Un worker care cere direct aceste rânduri (prin API, nu prin ecran)
  primește zero rânduri. Ascunderea în interfață este doar un plus, nu protecția.
- Totalurile (cost_inregistrat, marje) se calculează pe server sau în view-uri cu RLS; un worker
  nu primește niciodată sume, nici măcar pentru propriile ore.
- Worker: vede lucrările la care e asignat (adresă, descriere, responsabil, stare); poate
  adăuga/corecta DOAR propriile ore, costuri și poze; NU vede valoare contractată, buget, marje,
  tarife (nici pe al lui), suplimente.
- Manager: tot ce ține de clienți/lucrări/costuri/suplimente; nu gestionează membri și setări de firmă.
- Owner: tot, inclusiv membri, roluri, export, ștergere.
- Membru eliminat: rămâne în istoric (orele lui nu dispar), pierde imediat accesul (status inactiv
  - politica RLS îl exclude); un owner nu se poate elimina pe sine dacă e ultimul owner.
- Fișiere: bucket privat; acces doar prin URL semnat generat pe server după verificarea permisiunii.
- Linkuri client: token aleator lung (≥32 bytes), stocat doar ca hash; legat de o VERSIUNE
  precisă; expirare implicită 14 zile; revocabil; trimiterea unei versiuni noi revocă linkurile
  vechi. Pagina publică se servește printr-o rută de server care verifică hash, expirare, revocare
  și returnează DOAR descrierea, prețul, TVA, termenul și numele firmei; niciun cost intern, nicio
  altă lucrare. Decizia se scrie pe server într-o singură tranzacție; a doua decizie e refuzată de
  constrângerea unică.
- Ștergere: clienți/lucrări se arhivează (soft delete); ștergere definitivă doar de owner și doar
  pentru lucrări fără înregistrări; înregistrările de ore/costuri/facturări/încasări se „corectează”
  (rând nou care înlocuiește vechiul; vechiul rămâne în istoric, dar e exclus din calcule).
- Migrații versionate în `supabase/migrations/`.

## Ecrane și design

Direcție vizuală: fundal alb/gri foarte deschis, o culoare de accent (albastru-petrol), text
gri închis, font Inter (sistem ca rezervă), spațiere generoasă, butoane mari pe telefon (min 44px),
etichete clare, câmpuri numerice cu tastatură numerică pe telefon. Navigație: pe calculator bară
laterală; pe telefon bară de jos cu 4 intrări (Acasă, Lucrări, + Adaugă, Mai mult).
Componente shadcn/ui (accesibile, Tailwind).

Ecrane V1:

1. Autentificare + configurare firmă (B; în A ecran „demo: alege rolul”).
2. Pagina principală (owner/manager): lucrări active, buget vs. cost pe fiecare, suplimente în
   așteptare, suplimente aprobate nefacturate, listă „informații lipsă”.
3. Pagina principală (worker): „lucrările mele” + butoane mari „Adaugă ore”, „Adaugă material”, „Poză bon”.
4. Clienți: listă, detaliu cu lucrările lui, formular.
5. Lucrări: listă cu filtre pe stare; detaliu cu file: Rezumat (formule), Ore, Costuri, Suplimente, Fișiere, Istoric.
6. Adăugare ore / cost (formular rapid, optimizat pentru telefon, cu poză).
7. Supliment: creare ciornă, trimitere (generează link), versiune nouă, marcare facturat.
8. Pagina publică de răspuns a clientului (fără autentificare, prin link).
9. Rapoarte: per lucrare și per perioadă; export CSV.
10. Echipă și setări: membri, roluri, tarife, monedă, TVA, limbă.

Stări obligatorii pe fiecare ecran: încărcare (schelet), gol („Nu ai lucrări. Adaugă prima.”),
eroare (ce s-a întâmplat + „Încearcă din nou”), succes (toast), acces nepermis („Nu ai drepturi
pentru asta. Cere-i proprietarului.”). Niciun buton decorativ: ce nu e implementat se marchează
„În curând” și e dezactivat.

## Tehnologii (verificate în surse oficiale pe 2026-09-18)

| Rol                                  | Alegere                                                                        | De ce                                                                  | Alternative                                            |
| ------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| Rulare cod pe Mac                    | Node.js 24 LTS (v24.21.0)                                                      | Next.js cere ≥20.9; LTS = suport lung                                  | –                                                      |
| Aplicație                            | Next.js 16 (docs 16.3.5) + TypeScript                                          | O singură aplicație (ecrane + server); TypeScript prinde erori devreme | Remix/SvelteKit (mai puține resurse pentru începători) |
| Stil + componente                    | Tailwind CSS + shadcn/ui                                                       | Componente accesibile, copiate în proiect, ușor de adaptat             | Mantine, Chakra                                        |
| Multilingv                           | next-intl                                                                      | Dicționare JSON per limbă, funcționează cu App Router                  | Lingui                                                 |
| Bază de date, autentificare, fișiere | Supabase (PostgreSQL + Auth + Storage, RLS)                                    | Un singur serviciu pentru toate; RLS izolează firmele în DB            | Neon + Auth.js (mai multe piese de întreținut)         |
| Verificări                           | Vitest (calcule, stări) + Playwright (trasee în browser)                       | Proporțional cu riscul                                                 | –                                                      |
| Găzduire                             | Vercel (verificat: Hobby = doar uz personal, necomercial; Pro 20 USD/lună/loc) | Cea mai simplă pentru Next.js                                          | Netlify, Cloudflare, Railway, Coolify pe VPS           |
| Cod                                  | Git + GitHub (repo existent) + `gh` pentru autentificare                       | –                                                                      | –                                                      |

Versiunile exacte de pachete se confirmă la instalare (`npm view <pachet> version`).

## Costuri (surse oficiale, 2026-09-18)

Bugetul de 0–25 EUR/lună este o IPOTEZĂ DE LUCRU, nu un buget aprobat. Nimic plătit nu se
activează fără acordul explicit al utilizatorului, dat la momentul respectiv.

Fapte verificate:

- Supabase Free: 500 MB DB, 1 GB fișiere, 2 proiecte active, proiectul se oprește după 7 zile fără
  activitate. Supabase Pro: de la 25 USD/lună, backup zilnic 7 zile, nu se oprește.
- Vercel Hobby: gratuit, doar uz personal necomercial. Vercel Pro: 20 USD/lună per loc.
- Domeniu: ~10–15 EUR/an (de verificat la registrar la momentul achiziției).

Regula pe etape (fără contradicții):

- Etapa 3 (demo): 0 EUR. Totul local, fără servicii.
- Etapa 4 (dezvoltare pilot): Supabase Free pentru mediul de dezvoltare/test cu date fictive.
  Oprirea după 7 zile e acceptabilă aici (se repornește manual). Fără Vercel: aplicația rulează local.
- Etapa 5 (pilot cu firme reale): planurile gratuite NU sunt potrivite (Supabase se oprește;
  Vercel Hobby interzice uz comercial). Înainte de Etapa 5, Claude prezintă o decizie de cost cu
  opțiuni verificate la zi (ex.: Supabase Pro + Vercel Pro ≈ 45 USD/lună; sau găzduire alternativă
  care permite uz comercial gratuit/ieftin). Utilizatorul alege; până atunci nu se plătește nimic.

Email (verificare obligatorie înainte de Etapa 4.2, din documentația oficială Supabase):

- Invitațiile de membri și recuperarea parolei trec prin emailurile Supabase Auth. Serviciul de
  email implicit al Supabase are limite de trimitere destinate dezvoltării; pentru pilot este de
  așteptat să fie nevoie de un furnizor SMTP propriu (ex. Resend, Postmark; planurile gratuite se
  verifică atunci). Limitele exacte și pașii de configurare se citesc din docs la acel moment,
  nu din memorie, și se trec în docs/lansare.md.
- Trimiterea propunerilor către clienți NU folosește email în V1: firma copiază linkul și îl
  trimite pe WhatsApp/SMS. Fără cost și fără furnizor suplimentar.

Distincție: abonamentul plătit de firme către SiteMargin (mai târziu, manual la început) ≠
facturile emise de firme propriilor clienți (nu le facem în V1).

## Git și GitHub

Salvarea codului pe GitHub = copie de siguranță și istoric al codului, vizibil public.
Publicarea aplicației (Vercel) = aplicația rulează pe internet la o adresă, pentru utilizatori.
Sunt două lucruri diferite; a doua nu se face fără acord.

Pași (Etapa 0/2): instalare CLT → `git config` nume/email → `.gitignore` ÎNAINTE de primul `git add`
(node_modules, .env*, .next, .DS_Store) → `git init` + `git remote add origin` → `gh auth login`
(în browser, fără token în chat) → commit-uri pe etape funcționale → verificare `git status` și
`git diff --cached` înainte de fiecare push. Fără force push. `.env.example` doar cu nume de
variabile și valori demonstrative.

## Etape de implementare

**Etapa 0 – Pregătirea Mac-ului** (utilizatorul apasă, Claude ghidează)

- Instalare Command Line Tools (fereastra Apple), Node.js 24 LTS (installer .pkg de pe nodejs.org),
  Homebrew (opțional, pentru `gh`), `gh` + `gh auth login`.
- Verificări: `git --version`, `node --version`, `npm --version`, `gh auth status`.
- Rezultat: toate comenzile răspund cu versiuni.

**Etapa 1 – Verificarea ideii** (începe imediat, continuă în paralel cu 2–3)

- `docs/interviuri.md` cu ghidul de mai sus și fișă de notare per firmă.
- Rezultat: 3–5 discuții notate; decizie „continuăm spre pilot” după Etapa 3.

**Etapa 2 – Scheletul proiectului**

- `create-next-app` (TypeScript, Tailwind, ESLint, App Router, fără `src/`), shadcn/ui, next-intl
  (ro/en/nl cu ro completă), Vitest, Playwright, Prettier.
- README.md, CLAUDE.md, docs/plan.md, docs/progress.md, .env.example, .gitignore.
- Primul commit + push. Rezultat: `npm run dev` afișează pagina de start în română, repo pe GitHub.

**Etapa 3 – Demo (Etapa A)**

- 3.1 Tipuri + calcule pure + mașini de stări (lucrare, supliment) cu teste Vitest.
- 3.2 Repository în memorie + seed cu 2 firme fictive, 4 clienți, 6 lucrări, ore/costuri/suplimente.
- 3.3 Ecrane: pagina principală, clienți, lucrări, ore/costuri, supliment, pagina client (simulată),
  echipă/setări (afișare), banner DEMO, comutator de rol demo.
- 3.4 Export CSV. Test Playwright pe traseul complet. Documentație actualizată.
- Rezultat: demo rulabilă local, folosită la interviuri.

**Etapa 4 – Pilot (Etapa B)** – doar dacă Etapa 1 confirmă interesul

- 4.1 Proiect Supabase (gratuit, cu acordul utilizatorului), schemă + migrații + RLS + seed de test.
- 4.2 Verificare docs Supabase pentru limitele de email și SMTP propriu; apoi autentificare
  (email + parolă, recuperare), creare firmă, invitare/eliminare membri, roluri.
- 4.3 Repository Supabase în locul celui în memorie; fișiere în Storage privat; idempotency.
- 4.4 Suplimente cu versiuni, linkuri cu token hash/expirare/revocare, pagina publică.
- 4.5 Teste: izolare între 2 firme, acces direct prin id/fișier/link, expirare, permisiuni per rol.
- Rezultat: aplicație folosibilă de firme pilot, cu date reale, pe un mediu de test separat.

**Etapa 5 – Lansare pilot**

- Mediu test ≠ producție; secrete în Vercel/Supabase, nu în cod; domeniu + HTTPS; Sentry (sau
  echivalent, plan gratuit de verificat); backup + restaurare testată o dată; rollback = redeploy
  versiune anterioară; politică de confidențialitate (GDPR: firmele sunt „operatori”, SiteMargin
  „împuternicit” — de verificat cu un specialist înainte de lansare comercială); canal suport
  (email + WhatsApp al utilizatorului).
- Pilot: 2–3 firme, 4 săptămâni, obiective: fiecare firmă înregistrează costuri pe ≥1 lucrare
  reală, trimite ≥1 supliment prin link, și spune dacă ar plăti și cât.

**Etapa 6 – Mentenanță**

- Lunar: `npm outdated`, erori din monitorizare, costuri Supabase/Vercel, test de restaurare, feedback.

## Pentru mai târziu (nu în V1)

Cereri de ofertă și devize; calendar și programare; liste de verificare și rapoarte zilnice;
furnizori, cumpărături, stocuri; echipamente; subcontractori avansați; facturi, avansuri, plăți
parțiale; portal client; predare, remedieri, garanții; notificări și reamintiri; integrări
contabile; offline; WhatsApp; abonamente cu plată automată (Stripe); funcții AI; firme medii
10–30 oameni; engleză și olandeză complete (arhitectura e pregătită, traducerea e etapă separată).
Fiecare se reintroduce doar cu nevoie confirmată din pilot, cu explicarea costului.

## Documentație

README.md (ce e, cum pornește), CLAUDE.md (reguli + comenzi), docs/plan.md (acest plan, decizii),
docs/progress.md (ce merge, ce lipsește, următorul pas), docs/interviuri.md, apoi docs/date.md,
docs/permisiuni.md, docs/lansare.md când devin necesare. La reluare, Claude citește progress.md
și starea reală (git status, teste) înainte de orice.

## Verificare (cum știm că o etapă e gata)

- Etapa 0: comenzile de versiune răspund; `gh auth status` arată contul.
- Etapa 2: `npm run dev` pornește; `npm test` trece; commit vizibil pe GitHub.
- Etapa 3: teste Vitest pe formule: rotunjire; tarif istoric; buget_ramas ≠ cost_estimat_ramas;
  lipsa estimării → „estimare incompletă”, nu 0; corectarea unei înregistrări nu dublează;
  supliment cu versiune nouă acceptată înlocuiește, nu adună; versiune nouă respinsă lasă vechea
  în vigoare; a doua decizie pe aceeași versiune e refuzată. Playwright pe traseul complet;
  reîncărcarea păstrează datele demo; verificare la 375px și pe calculator.
- Etapa 4: test automat cu 2 firme și 2 utilizatori: fiecare vede doar datele lui, inclusiv la acces
  direct prin URL cu id-ul celeilalte firme, la fișiere și la link de supliment expirat/revocat;
  inserare cu client/lucrare din altă firmă refuzată de DB; worker nu primește rânduri din tabelele
  financiare nici prin API direct; dublă apăsare nu creează dublură; formulare greșite afișează
  mesaje clare.
- Nu se declară niciun test „trecut” fără să fi fost rulat; ce nu se poate verifica se spune explicit.

## Primul pas după aprobare

După aprobare se lucrează DOAR la Etapa 0 (pregătirea Mac-ului), câte un pas pe rând, cu
confirmarea rezultatului înainte de pasul următor: 1) Command Line Tools, 2) Node.js 24 LTS, 3) configurare Git, 4) Homebrew + gh + autentificare GitHub în browser. Fiecare pas: ce fereastră
apare, ce apeși, cât durează, ce comandă rulezi ca să confirmi. Nimic nu se instalează fără ca
utilizatorul să apese el. Implementarea (Etapa 2+) nu începe fără o nouă aprobare.
