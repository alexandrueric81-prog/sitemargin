/**
 * Calculele unei lucrări (docs/plan.md, „Formule”). Funcții pure, fără bază de date.
 * Toate marjele sunt „marjă directă”: nu includ salarii indirecte, chirie, unelte, taxe.
 */
import { isJobClosed } from "./job-state";
import { lineTotal, sumMinor, timeCost, type Minor } from "./money";
import { versionInForce } from "./proposal-state";
import type {
  Correctable,
  CostEntry,
  Id,
  IsoDate,
  Job,
  JobFinancials,
  JobInvoice,
  JobPayment,
  MemberRate,
  ProposalAggregate,
  ProposalInvoicing,
  TimeEntry,
  TimeEntryCost,
} from "./types";

/** Înregistrare valabilă = necorectată și nearhivată. Doar acestea intră în calcule. */
export function isValidRecord(
  record: Pick<Correctable, "supersededById" | "archivedAt">,
): boolean {
  return record.supersededById === null && record.archivedAt === null;
}

/**
 * Corectare: rândul vechi rămâne în istoric, dar e marcat ca înlocuit de cel nou.
 * Întoarce lista nouă; aruncă eroare dacă rândul vechi lipsește sau a fost deja înlocuit.
 */
export function correctRecord<T extends Correctable>(
  records: readonly T[],
  oldId: Id,
  replacement: T,
): T[] {
  const old = records.find((record) => record.id === oldId);
  if (!old) throw new Error(`înregistrarea ${oldId} nu există`);
  if (!isValidRecord(old))
    throw new Error(`înregistrarea ${oldId} nu mai este valabilă`);
  return [
    ...records.map((record) =>
      record.id === oldId
        ? { ...record, supersededById: replacement.id }
        : record,
    ),
    { ...replacement, supersedesId: oldId, supersededById: null },
  ];
}

/** Tariful valabil la o dată: cel mai recent `validFrom` care nu depășește data. */
export function rateAt(
  rates: readonly MemberRate[],
  memberId: Id,
  date: IsoDate,
): MemberRate | null {
  return rates
    .filter((rate) => rate.memberId === memberId && rate.validFrom <= date)
    .reduce<MemberRate | null>(
      (best, rate) => (!best || rate.validFrom > best.validFrom ? rate : best),
      null,
    );
}

/**
 * Costul unei înregistrări de ore, cu tariful COPIAT de la data ei. Se apelează o singură
 * dată, la creare; schimbarea ulterioară a tarifului nu atinge înregistrările vechi.
 * `null` = membrul nu avea tarif la acea dată („ore fără tarif”).
 */
export function buildTimeEntryCost(
  entry: Pick<TimeEntry, "id" | "memberId" | "date" | "minutes">,
  rates: readonly MemberRate[],
): TimeEntryCost | null {
  const rate = rateAt(rates, entry.memberId, entry.date);
  if (!rate) return null;
  return {
    timeEntryId: entry.id,
    copiedHourlyRate: rate.hourlyRate,
    amount: timeCost(entry.minutes, rate.hourlyRate),
  };
}

/** Totalul unei linii de cost, calculat o singură dată la introducere. */
export function buildCostTotal(
  quantityMilli: number,
  unitPrice: Minor | null,
): Minor | null {
  return unitPrice === null ? null : lineTotal(quantityMilli, unitPrice);
}

/** Estimarea costului rămas: ori cunoscută, ori „estimare incompletă” (niciodată 0 implicit). */
export type Estimate =
  { status: "known"; amount: Minor } | { status: "incomplete" };

export interface UncertaintyFlags {
  /** Lucrare fără buget de costuri. */
  noBudget: boolean;
  /** Ore înregistrate pentru care nu exista tarif. */
  hoursWithoutRate: boolean;
  /** Materiale fără preț. */
  materialsWithoutPrice: boolean;
  /** Lucrare în desfășurare fără niciun cost înregistrat de peste 7 zile. */
  activeWithoutRecentCosts: boolean;
  /** Supliment acceptat cu preț 0. */
  acceptedProposalWithoutPrice: boolean;
}

export interface JobSummary {
  /** valoare_contractata */
  contractedValue: Minor;
  /** buget_cost; `null` = lucrare fără buget. */
  costBudget: Minor | null;
  /** cost_inregistrat */
  recordedCost: Minor;
  /** buget_ramas: cât din buget mai e disponibil. NU e o estimare a ce urmează să coste. */
  budgetRemaining: Minor | null;
  /** Cu cât a depășit costul bugetul (0 dacă nu l-a depășit). */
  budgetOverrun: Minor | null;
  /** cost_estimat_ramas */
  estimatedRemainingCost: Estimate;
  /** marja_directa_provizorie; `null` când lucrarea e finalizată (atunci există cea finală). */
  provisionalDirectMargin: Minor | null;
  /** marja_directa_estimata_final */
  estimatedFinalDirectMargin: Estimate;
  /** marja_directa_finala; doar când starea e „finalizată”. */
  finalDirectMargin: Minor | null;
  invoiced: Minor;
  collected: Minor;
  /** de_facturat (poate fi negativ dacă s-a facturat mai mult decât valoarea contractată). */
  toInvoice: Minor;
  /** de_incasat */
  toCollect: Minor;
  /** suplimente_aprobate_nefacturate */
  approvedUninvoicedProposals: Minor;
  flags: UncertaintyFlags;
  /** Adevărat dacă cel puțin un indicator de „estimare nesigură” e activ. */
  uncertain: boolean;
}

export interface JobSummaryInput {
  job: Pick<Job, "state" | "startDate">;
  financials: Pick<
    JobFinancials,
    "agreedValue" | "costBudget" | "estimatedRemainingCost"
  >;
  timeEntries: readonly TimeEntry[];
  timeEntryCosts: readonly TimeEntryCost[];
  costEntries: readonly CostEntry[];
  proposals: readonly ProposalAggregate[];
  proposalInvoicing: readonly ProposalInvoicing[];
  invoices: readonly JobInvoice[];
  payments: readonly JobPayment[];
  today: IsoDate;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

export const STALE_COST_DAYS = 7;

export function summarizeJob(input: JobSummaryInput): JobSummary {
  const { job, financials, today } = input;
  const timeEntries = input.timeEntries.filter(isValidRecord);
  const costEntries = input.costEntries.filter(isValidRecord);
  const inForce = input.proposals.flatMap((agg) => {
    const version = versionInForce(agg);
    return version ? [version] : [];
  });

  const contractedValue =
    financials.agreedValue + sumMinor(inForce.map((v) => v.priceExVat));
  const costBudget =
    financials.costBudget === null
      ? null
      : financials.costBudget +
        sumMinor(inForce.map((v) => v.budgetEffect ?? 0));

  const costByEntry = new Map(
    input.timeEntryCosts.map((cost) => [cost.timeEntryId, cost.amount]),
  );
  const labourCost = sumMinor(
    timeEntries.map((entry) => costByEntry.get(entry.id) ?? 0),
  );
  const otherCost = sumMinor(costEntries.map((entry) => entry.total ?? 0));
  const recordedCost = labourCost + otherCost;

  const closed = isJobClosed(job.state);
  const estimatedRemainingCost: Estimate = closed
    ? { status: "known", amount: 0 }
    : financials.estimatedRemainingCost === null
      ? { status: "incomplete" }
      : { status: "known", amount: financials.estimatedRemainingCost };

  const margin = contractedValue - recordedCost;
  const invoiced = sumMinor(
    input.invoices.filter(isValidRecord).map((i) => i.amount),
  );
  const collected = sumMinor(
    input.payments.filter(isValidRecord).map((p) => p.amount),
  );
  const invoicedProposalIds = new Set(
    input.proposalInvoicing.map((mark) => mark.proposalId),
  );

  const lastCostDate = [...timeEntries, ...costEntries]
    .map((entry) => entry.date)
    .reduce<IsoDate | null>(
      (latest, date) => (!latest || date > latest ? date : latest),
      null,
    );
  const reference = lastCostDate ?? job.startDate;

  const flags: UncertaintyFlags = {
    noBudget: costBudget === null,
    hoursWithoutRate: timeEntries.some((entry) => !costByEntry.has(entry.id)),
    materialsWithoutPrice: costEntries.some(
      (entry) => entry.type === "material" && entry.total === null,
    ),
    activeWithoutRecentCosts:
      job.state === "active" &&
      (reference === null || daysBetween(reference, today) > STALE_COST_DAYS),
    acceptedProposalWithoutPrice: inForce.some(
      (version) => version.priceExVat === 0,
    ),
  };

  return {
    contractedValue,
    costBudget,
    recordedCost,
    budgetRemaining:
      costBudget === null ? null : Math.max(0, costBudget - recordedCost),
    budgetOverrun:
      costBudget === null ? null : Math.max(0, recordedCost - costBudget),
    estimatedRemainingCost,
    provisionalDirectMargin: job.state === "done" ? null : margin,
    estimatedFinalDirectMargin:
      estimatedRemainingCost.status === "known"
        ? { status: "known", amount: margin - estimatedRemainingCost.amount }
        : { status: "incomplete" },
    finalDirectMargin: job.state === "done" ? margin : null,
    invoiced,
    collected,
    toInvoice: contractedValue - invoiced,
    toCollect: invoiced - collected,
    approvedUninvoicedProposals: sumMinor(
      inForce
        .filter((v) => !invoicedProposalIds.has(v.proposalId))
        .map((v) => v.priceExVat),
    ),
    flags,
    uncertain: Object.values(flags).some(Boolean),
  };
}
