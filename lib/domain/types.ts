/**
 * Tipurile de date ale aplicației (docs/plan.md, „Model de date”).
 * Aceleași tipuri se folosesc în demo (Etapa 3) și în pilot (Etapa 4).
 *
 * Convenții:
 * - sume: `Minor` (întregi în unități minime);
 * - date calendaristice: text „AAAA-LL-ZZ”; momente: text ISO UTC („2026-09-19T10:00:00.000Z”).
 *   Ambele forme se pot compara direct ca text.
 * - ore: minute întregi (7,5 ore = 450); cantități: miimi (2,5 = 2500).
 */
import type { Minor } from "./money";

export type Id = string;
export type IsoDate = string;
export type IsoDateTime = string;

export type Currency = "RON" | "EUR";
export type Role = "owner" | "manager" | "worker";

export interface Company {
  id: Id;
  name: string;
  currency: Currency;
  /** Cota TVA implicită, în puncte de bază (19% = 1900). */
  defaultVatRateBp: number;
  country: string;
  defaultLocale: string;
}

export interface Member {
  id: Id;
  companyId: Id;
  name: string;
  role: Role;
  removedAt: IsoDateTime | null;
}

/** FINANCIAR (doar owner/manager). Tarif orar valabil începând cu o dată. */
export interface MemberRate {
  id: Id;
  companyId: Id;
  memberId: Id;
  hourlyRate: Minor;
  validFrom: IsoDate;
}

export interface Client {
  id: Id;
  companyId: Id;
  name: string;
  contact: string;
  address: string;
  notes: string;
  archivedAt: IsoDateTime | null;
}

export type JobState = "planned" | "active" | "paused" | "done" | "cancelled";

/** Lucrarea, fără sume (sumele stau separat, în JobFinancials). */
export interface Job {
  id: Id;
  companyId: Id;
  clientId: Id;
  address: string;
  description: string;
  responsibleMemberId: Id | null;
  startDate: IsoDate | null;
  estimatedEndDate: IsoDate | null;
  state: JobState;
  archivedAt: IsoDateTime | null;
}

/** FINANCIAR (doar owner/manager). */
export interface JobFinancials {
  jobId: Id;
  companyId: Id;
  /** Valoarea convenită inițial cu clientul, fără TVA. */
  agreedValue: Minor;
  /** Bugetul de costuri; `null` = lucrare fără buget. */
  costBudget: Minor | null;
  /** Estimare manuală a costului rămas; `null` = necompletată (NU înseamnă 0). */
  estimatedRemainingCost: Minor | null;
  estimatedRemainingCostUpdatedAt: IsoDateTime | null;
}

/** Câmpurile comune înregistrărilor care se „corectează” în loc să se editeze. */
export interface Correctable {
  id: Id;
  /** Rândul vechi pe care acesta îl înlocuiește. */
  supersedesId: Id | null;
  /** Rândul nou care l-a înlocuit pe acesta; dacă există, rândul nu mai intră în calcule. */
  supersededById: Id | null;
  archivedAt: IsoDateTime | null;
}

/** Înregistrare de ore, fără tarif (worker-ul nu vede sume). */
export interface TimeEntry extends Correctable {
  companyId: Id;
  jobId: Id;
  memberId: Id;
  date: IsoDate;
  minutes: number;
  note: string;
}

/** FINANCIAR. Tariful copiat la data înregistrării și suma rezultată. */
export interface TimeEntryCost {
  timeEntryId: Id;
  copiedHourlyRate: Minor;
  amount: Minor;
}

export type CostType = "material" | "other" | "subcontractor";

export interface CostEntry extends Correctable {
  companyId: Id;
  jobId: Id;
  type: CostType;
  description: string;
  quantityMilli: number;
  /** `null` = preț încă necunoscut (ex. bon fără sumă). */
  unitPrice: Minor | null;
  /** Calculat o singură dată, la introducere; `null` dacă lipsește prețul. */
  total: Minor | null;
  date: IsoDate;
  supplier: string;
  enteredByMemberId: Id;
}

export type ProposalVersionState =
  "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";

/** Supliment (lucrare suplimentară propusă clientului). Conținutul stă în versiuni. */
export interface Proposal {
  id: Id;
  companyId: Id;
  jobId: Id;
}

/** Conținutul unei versiuni: ce se poate edita cât timp e ciornă. */
export interface ProposalVersionContent {
  description: string;
  priceExVat: Minor;
  vatRateBp: number;
  /** Cu câte zile se mută termenul lucrării. */
  scheduleEffectDays: number;
  /** Cu cât crește bugetul de costuri; `null` = necompletat. */
  budgetEffect: Minor | null;
}

export interface ProposalVersion extends ProposalVersionContent {
  id: Id;
  proposalId: Id;
  versionNumber: number;
  state: ProposalVersionState;
  sentAt: IsoDateTime | null;
  expiresAt: IsoDateTime | null;
}

/** O singură decizie per versiune. */
export interface ProposalDecision {
  versionId: Id;
  decision: "accepted" | "rejected";
  decidedAt: IsoDateTime;
  clientName: string;
}

/** Marcajul manual „am facturat acest supliment”. */
export interface ProposalInvoicing {
  proposalId: Id;
  invoicedAt: IsoDate;
  reference: string;
}

/** „Am facturat X la data Y, referință Z” (manual). */
export interface JobInvoice extends Correctable {
  companyId: Id;
  jobId: Id;
  amount: Minor;
  date: IsoDate;
  reference: string;
}

/** „Am încasat X la data Y” (manual). */
export interface JobPayment extends Correctable {
  companyId: Id;
  jobId: Id;
  amount: Minor;
  date: IsoDate;
  note: string;
}

/** Un supliment împreună cu versiunile și deciziile lui. */
export interface ProposalAggregate {
  proposal: Proposal;
  versions: ProposalVersion[];
  decisions: ProposalDecision[];
}

/** Rezultat fără excepții: fie valoarea, fie un cod de eroare (textul vine din traduceri). */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
