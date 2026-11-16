import { describe, expect, it } from "vitest";
import {
  buildCostTotal,
  buildTimeEntryCost,
  correctRecord,
  rateAt,
  summarizeJob,
  type JobSummaryInput,
} from "./calculations";
import {
  createDraftVersion,
  decideVersion,
  sendVersion,
} from "./proposal-state";
import { content, costEntry, emptyProposal, timeEntry } from "./test-helpers";
import type { MemberRate, ProposalAggregate, Result } from "./types";

const rates: MemberRate[] = [
  {
    id: "r1",
    companyId: "c1",
    memberId: "m1",
    hourlyRate: 4000,
    validFrom: "2026-01-01",
  },
  {
    id: "r2",
    companyId: "c1",
    memberId: "m1",
    hourlyRate: 5000,
    validFrom: "2026-09-01",
  },
];

function ok<E>(result: Result<ProposalAggregate, E>): ProposalAggregate {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

/** Supliment acceptat: 500,00 preț, +300,00 buget. */
function acceptedProposal(id = "p1"): ProposalAggregate {
  const draft = ok(
    createDraftVersion(emptyProposal(id), `${id}-v1`, content()),
  );
  const sent = ok(
    sendVersion(
      draft,
      `${id}-v1`,
      "2026-09-01T08:00:00.000Z",
      "2026-09-15T08:00:00.000Z",
    ),
  );
  return ok(
    decideVersion(
      sent,
      `${id}-v1`,
      "accepted",
      "2026-09-02T08:00:00.000Z",
      "Ana Popescu",
    ),
  );
}

/** Lucrare activă: valoare 10.000,00, buget 6.000,00, o zi de muncă și un material. */
function input(over: Partial<JobSummaryInput> = {}): JobSummaryInput {
  const entry = timeEntry();
  return {
    job: { state: "active", startDate: "2026-09-01" },
    financials: {
      agreedValue: 1_000_000,
      costBudget: 600_000,
      estimatedRemainingCost: 250_000,
    },
    timeEntries: [entry],
    timeEntryCosts: [buildTimeEntryCost(entry, rates)!], // 8 h × 50,00 = 400,00
    costEntries: [costEntry()], // 200,00
    proposals: [],
    proposalInvoicing: [],
    invoices: [],
    payments: [],
    today: "2026-09-12",
    ...over,
  };
}

describe("tarif istoric", () => {
  it("alege tariful valabil la data înregistrării", () => {
    expect(rateAt(rates, "m1", "2026-08-31")?.hourlyRate).toBe(4000);
    expect(rateAt(rates, "m1", "2026-09-01")?.hourlyRate).toBe(5000);
    expect(rateAt(rates, "m1", "2025-12-31")).toBeNull();
    expect(rateAt(rates, "alt-membru", "2026-09-01")).toBeNull();
  });

  it("schimbarea tarifului nu modifică înregistrările vechi", () => {
    const august = timeEntry({ id: "t-aug", date: "2026-08-20", minutes: 60 });
    const costBefore = buildTimeEntryCost(august, rates.slice(0, 1));
    const costAfterRaise = buildTimeEntryCost(august, rates);
    expect(costBefore).toEqual({
      timeEntryId: "t-aug",
      copiedHourlyRate: 4000,
      amount: 4000,
    });
    expect(costAfterRaise).toEqual(costBefore);
  });

  it("fără tarif nu inventează un cost", () => {
    expect(buildTimeEntryCost(timeEntry({ memberId: "m2" }), rates)).toBeNull();
    expect(buildCostTotal(2500, null)).toBeNull();
    expect(buildCostTotal(2500, 1999)).toBe(4998);
  });
});

describe("rezumatul lucrării", () => {
  it("calculează valoarea, costul și bugetul rămas", () => {
    const summary = summarizeJob(input());
    expect(summary.contractedValue).toBe(1_000_000);
    expect(summary.recordedCost).toBe(60_000);
    expect(summary.costBudget).toBe(600_000);
    expect(summary.budgetRemaining).toBe(540_000);
    expect(summary.budgetOverrun).toBe(0);
    expect(summary.uncertain).toBe(false);
  });

  it("bugetul rămas NU este costul estimat rămas", () => {
    const summary = summarizeJob(input());
    expect(summary.budgetRemaining).toBe(540_000);
    expect(summary.estimatedRemainingCost).toEqual({
      status: "known",
      amount: 250_000,
    });
    // marja estimată folosește estimarea, nu bugetul rămas
    expect(summary.estimatedFinalDirectMargin).toEqual({
      status: "known",
      amount: 690_000,
    });
  });

  it("bugetul rămas nu coboară sub 0; depășirea se vede separat", () => {
    const summary = summarizeJob(
      input({
        financials: {
          agreedValue: 1_000_000,
          costBudget: 50_000,
          estimatedRemainingCost: 0,
        },
      }),
    );
    expect(summary.budgetRemaining).toBe(0);
    expect(summary.budgetOverrun).toBe(10_000);
  });

  it("lipsa estimării dă „estimare incompletă”, niciodată 0", () => {
    const summary = summarizeJob(
      input({
        financials: {
          agreedValue: 1_000_000,
          costBudget: 600_000,
          estimatedRemainingCost: null,
        },
      }),
    );
    expect(summary.estimatedRemainingCost).toEqual({ status: "incomplete" });
    expect(summary.estimatedFinalDirectMargin).toEqual({
      status: "incomplete",
    });
    expect(summary.provisionalDirectMargin).toBe(940_000);
  });

  it("marja finală există doar la lucrare finalizată", () => {
    const active = summarizeJob(input());
    expect(active.finalDirectMargin).toBeNull();
    expect(active.provisionalDirectMargin).toBe(940_000);

    const done = summarizeJob(
      input({
        job: { state: "done", startDate: "2026-09-01" },
        financials: {
          agreedValue: 1_000_000,
          costBudget: 600_000,
          estimatedRemainingCost: null,
        },
      }),
    );
    expect(done.finalDirectMargin).toBe(940_000);
    expect(done.provisionalDirectMargin).toBeNull();
    expect(done.estimatedRemainingCost).toEqual({ status: "known", amount: 0 });
  });

  it("marja poate fi negativă (lucrare în pierdere)", () => {
    const summary = summarizeJob(
      input({
        financials: {
          agreedValue: 50_000,
          costBudget: 40_000,
          estimatedRemainingCost: 0,
        },
      }),
    );
    expect(summary.provisionalDirectMargin).toBe(-10_000);
  });
});

describe("corectări", () => {
  it("corectarea unei înregistrări nu dublează costul", () => {
    const original = costEntry();
    const fixed = costEntry({ id: "k2", unitPrice: 25000, total: 25000 });
    const corrected = correctRecord([original], "k1", fixed);

    expect(corrected).toHaveLength(2); // istoricul rămâne
    expect(corrected[0].supersededById).toBe("k2");
    expect(corrected[1].supersedesId).toBe("k1");
    // 400,00 ore + 250,00 material corectat (nu 200 + 250)
    expect(summarizeJob(input({ costEntries: corrected })).recordedCost).toBe(
      65_000,
    );
  });

  it("o înregistrare deja înlocuită nu mai poate fi corectată încă o dată", () => {
    const corrected = correctRecord(
      [costEntry()],
      "k1",
      costEntry({ id: "k2" }),
    );
    expect(() =>
      correctRecord(corrected, "k1", costEntry({ id: "k3" })),
    ).toThrow();
    expect(() =>
      correctRecord(corrected, "nu-exista", costEntry({ id: "k3" })),
    ).toThrow();
  });

  it("înregistrările arhivate și costurile orelor corectate nu se numără", () => {
    const old = timeEntry();
    const fixed = timeEntry({ id: "t2", minutes: 240 });
    const entries = correctRecord([old], "t1", fixed);
    const summary = summarizeJob(
      input({
        timeEntries: entries,
        timeEntryCosts: [
          buildTimeEntryCost(old, rates)!,
          buildTimeEntryCost(fixed, rates)!,
        ],
        costEntries: [costEntry({ archivedAt: "2026-09-11T09:00:00.000Z" })],
      }),
    );
    expect(summary.recordedCost).toBe(20_000); // doar 4 h × 50,00
  });
});

describe("suplimente în calcule", () => {
  it("suplimentul acceptat mărește valoarea contractată și bugetul", () => {
    const summary = summarizeJob(input({ proposals: [acceptedProposal()] }));
    expect(summary.contractedValue).toBe(1_050_000);
    expect(summary.costBudget).toBe(630_000);
    expect(summary.approvedUninvoicedProposals).toBe(50_000);
  });

  it("versiunea nouă acceptată înlocuiește, nu se adună", () => {
    const draft = ok(
      createDraftVersion(
        acceptedProposal(),
        "p1-v2",
        content({ priceExVat: 80_000, budgetEffect: null }),
      ),
    );
    const sent = ok(
      sendVersion(
        draft,
        "p1-v2",
        "2026-09-03T08:00:00.000Z",
        "2026-09-17T08:00:00.000Z",
      ),
    );
    // cât timp v2 e doar trimisă, contează v1
    expect(summarizeJob(input({ proposals: [sent] })).contractedValue).toBe(
      1_050_000,
    );

    const accepted = ok(
      decideVersion(
        sent,
        "p1-v2",
        "accepted",
        "2026-09-04T08:00:00.000Z",
        "Ana Popescu",
      ),
    );
    const summary = summarizeJob(input({ proposals: [accepted] }));
    expect(summary.contractedValue).toBe(1_080_000); // nu 1.130.000
    expect(summary.costBudget).toBe(600_000); // v2 nu are efect de buget completat
  });

  it("versiunea nouă respinsă lasă valoarea veche", () => {
    const draft = ok(
      createDraftVersion(
        acceptedProposal(),
        "p1-v2",
        content({ priceExVat: 80_000 }),
      ),
    );
    const sent = ok(
      sendVersion(
        draft,
        "p1-v2",
        "2026-09-03T08:00:00.000Z",
        "2026-09-17T08:00:00.000Z",
      ),
    );
    const rejected = ok(
      decideVersion(
        sent,
        "p1-v2",
        "rejected",
        "2026-09-04T08:00:00.000Z",
        "Ana Popescu",
      ),
    );
    expect(summarizeJob(input({ proposals: [rejected] })).contractedValue).toBe(
      1_050_000,
    );
  });

  it("suplimentele marcate ca facturate ies din „aprobate nefacturate”", () => {
    const summary = summarizeJob(
      input({
        proposals: [acceptedProposal("p1"), acceptedProposal("p2")],
        proposalInvoicing: [
          { proposalId: "p1", invoicedAt: "2026-09-05", reference: "F-001" },
        ],
      }),
    );
    expect(summary.contractedValue).toBe(1_100_000);
    expect(summary.approvedUninvoicedProposals).toBe(50_000);
  });
});

describe("facturat și încasat", () => {
  it("de facturat și de încasat, cu corectări excluse", () => {
    const invoice = {
      companyId: "c1",
      jobId: "j1",
      date: "2026-09-05",
      reference: "F-001",
      supersedesId: null,
      archivedAt: null,
    };
    const summary = summarizeJob(
      input({
        invoices: [
          { ...invoice, id: "i1", amount: 300_000, supersededById: "i2" },
          {
            ...invoice,
            id: "i2",
            amount: 400_000,
            supersededById: null,
            supersedesId: "i1",
          },
        ],
        payments: [
          {
            id: "pay1",
            companyId: "c1",
            jobId: "j1",
            amount: 150_000,
            date: "2026-09-08",
            note: "",
            supersedesId: null,
            supersededById: null,
            archivedAt: null,
          },
        ],
      }),
    );
    expect(summary.invoiced).toBe(400_000);
    expect(summary.collected).toBe(150_000);
    expect(summary.toInvoice).toBe(600_000);
    expect(summary.toCollect).toBe(250_000);
  });
});

describe("indicatori „estimare nesigură”", () => {
  it("lucrare fără buget: bugetul rămas e necunoscut, nu 0", () => {
    const summary = summarizeJob(
      input({
        financials: {
          agreedValue: 1_000_000,
          costBudget: null,
          estimatedRemainingCost: 0,
        },
      }),
    );
    expect(summary.flags.noBudget).toBe(true);
    expect(summary.costBudget).toBeNull();
    expect(summary.budgetRemaining).toBeNull();
    expect(summary.uncertain).toBe(true);
  });

  it("ore fără tarif și materiale fără preț", () => {
    const summary = summarizeJob(
      input({
        timeEntryCosts: [],
        costEntries: [costEntry({ unitPrice: null, total: null })],
      }),
    );
    expect(summary.flags.hoursWithoutRate).toBe(true);
    expect(summary.flags.materialsWithoutPrice).toBe(true);
    expect(summary.recordedCost).toBe(0);
  });

  it("lucrare activă fără costuri de peste 7 zile", () => {
    expect(
      summarizeJob(input({ today: "2026-09-17" })).flags
        .activeWithoutRecentCosts,
    ).toBe(false); // exact 7 zile
    expect(
      summarizeJob(input({ today: "2026-09-18" })).flags
        .activeWithoutRecentCosts,
    ).toBe(true);
    const noEntries = { timeEntries: [], timeEntryCosts: [], costEntries: [] };
    expect(
      summarizeJob(input({ ...noEntries, today: "2026-09-09" })).flags
        .activeWithoutRecentCosts,
    ).toBe(true); // de la start
    expect(
      summarizeJob(
        input({
          today: "2026-12-01",
          job: { state: "paused", startDate: "2026-09-01" },
        }),
      ).flags.activeWithoutRecentCosts,
    ).toBe(false);
  });

  it("supliment acceptat fără preț", () => {
    const draft = ok(
      createDraftVersion(emptyProposal(), "v1", content({ priceExVat: 0 })),
    );
    const sent = ok(
      sendVersion(
        draft,
        "v1",
        "2026-09-01T08:00:00.000Z",
        "2026-09-15T08:00:00.000Z",
      ),
    );
    const accepted = ok(
      decideVersion(
        sent,
        "v1",
        "accepted",
        "2026-09-02T08:00:00.000Z",
        "Ana Popescu",
      ),
    );
    expect(
      summarizeJob(input({ proposals: [accepted] })).flags
        .acceptedProposalWithoutPrice,
    ).toBe(true);
  });
});
