/** Date fictive pentru teste. */
import type {
  CostEntry,
  ProposalAggregate,
  ProposalVersionContent,
  TimeEntry,
} from "./types";

export const content = (
  over: Partial<ProposalVersionContent> = {},
): ProposalVersionContent => ({
  description: "Mutare priză în bucătărie",
  priceExVat: 50000,
  vatRateBp: 1900,
  scheduleEffectDays: 1,
  budgetEffect: 30000,
  ...over,
});

export const emptyProposal = (id = "p1"): ProposalAggregate => ({
  proposal: { id, companyId: "c1", jobId: "j1" },
  versions: [],
  decisions: [],
});

export const timeEntry = (over: Partial<TimeEntry> = {}): TimeEntry => ({
  id: "t1",
  companyId: "c1",
  jobId: "j1",
  memberId: "m1",
  date: "2026-09-10",
  minutes: 480,
  note: "",
  supersedesId: null,
  supersededById: null,
  archivedAt: null,
  ...over,
});

export const costEntry = (over: Partial<CostEntry> = {}): CostEntry => ({
  id: "k1",
  companyId: "c1",
  jobId: "j1",
  type: "material",
  description: "Gresie",
  quantityMilli: 1000,
  unitPrice: 20000,
  total: 20000,
  date: "2026-09-10",
  supplier: "Depozit Fictiv SRL",
  enteredByMemberId: "m1",
  supersedesId: null,
  supersededById: null,
  archivedAt: null,
  ...over,
});
