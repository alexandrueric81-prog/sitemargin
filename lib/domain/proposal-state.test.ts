import { describe, expect, it } from "vitest";
import {
  cancelVersion,
  createDraftVersion,
  decideVersion,
  editDraftVersion,
  expireVersions,
  pendingVersion,
  sendVersion,
  versionInForce,
} from "./proposal-state";
import { content, emptyProposal } from "./test-helpers";
import type { ProposalAggregate, Result } from "./types";

const T1 = "2026-09-01T10:00:00.000Z";
const T2 = "2026-09-02T10:00:00.000Z";
const T3 = "2026-09-03T10:00:00.000Z";
const LATER = "2026-09-15T10:00:00.000Z";
const AFTER = "2026-09-20T10:00:00.000Z";

function ok<E>(result: Result<ProposalAggregate, E>): ProposalAggregate {
  if (!result.ok)
    throw new Error(`eșec neașteptat: ${JSON.stringify(result.error)}`);
  return result.value;
}

/** Supliment cu versiunea 1 trimisă. */
function sentV1(): ProposalAggregate {
  const draft = ok(createDraftVersion(emptyProposal(), "v1", content()));
  return ok(sendVersion(draft, "v1", T1, LATER));
}

/** Supliment cu v1 acceptată și v2 (preț mai mare) trimisă. */
function acceptedV1SentV2(): ProposalAggregate {
  const accepted = ok(
    decideVersion(sentV1(), "v1", "accepted", T2, "Ana Popescu"),
  );
  const draft = ok(
    createDraftVersion(accepted, "v2", content({ priceExVat: 80000 })),
  );
  return ok(sendVersion(draft, "v2", T2, LATER));
}

describe("ciorne și trimitere", () => {
  it("versiunile se numerotează 1, 2, … și există cel mult o ciornă", () => {
    const first = ok(createDraftVersion(emptyProposal(), "v1", content()));
    expect(first.versions[0]).toMatchObject({
      versionNumber: 1,
      state: "draft",
    });
    expect(createDraftVersion(first, "v2", content())).toEqual({
      ok: false,
      error: { code: "draft_exists", versionId: "v1" },
    });
  });

  it("ciorna se poate modifica; versiunea trimisă este imuabilă", () => {
    const draft = ok(createDraftVersion(emptyProposal(), "v1", content()));
    const edited = ok(
      editDraftVersion(draft, "v1", content({ priceExVat: 60000 })),
    );
    expect(edited.versions[0].priceExVat).toBe(60000);

    const sent = ok(sendVersion(edited, "v1", T1, LATER));
    expect(editDraftVersion(sent, "v1", content({ priceExVat: 1 }))).toEqual({
      ok: false,
      error: { code: "not_draft", state: "sent" },
    });
    expect(sendVersion(sent, "v1", T2, LATER).ok).toBe(false);
  });

  it("refuză o dată de expirare care nu e în viitor", () => {
    const draft = ok(createDraftVersion(emptyProposal(), "v1", content()));
    expect(sendVersion(draft, "v1", T2, T1)).toEqual({
      ok: false,
      error: { code: "invalid_expiry" },
    });
  });

  it("nu modifică obiectul primit (funcții pure)", () => {
    const draft = ok(createDraftVersion(emptyProposal(), "v1", content()));
    const snapshot = structuredClone(draft);
    sendVersion(draft, "v1", T1, LATER);
    expect(draft).toEqual(snapshot);
  });

  it("trimiterea unei versiuni noi anulează versiunea trimisă anterior și nedecisă", () => {
    const draft2 = ok(
      createDraftVersion(sentV1(), "v2", content({ priceExVat: 70000 })),
    );
    const sent2 = ok(sendVersion(draft2, "v2", T2, LATER));
    expect(sent2.versions.map((v) => v.state)).toEqual(["cancelled", "sent"]);
    expect(pendingVersion(sent2)?.id).toBe("v2");
    // linkul vechi nu mai poate fi folosit
    expect(decideVersion(sent2, "v1", "accepted", T3, "Ana Popescu")).toEqual({
      ok: false,
      error: { code: "not_open", state: "cancelled" },
    });
  });
});

describe("decizia clientului", () => {
  it("acceptarea pune versiunea în vigoare", () => {
    const accepted = ok(
      decideVersion(sentV1(), "v1", "accepted", T2, "Ana Popescu"),
    );
    expect(versionInForce(accepted)?.id).toBe("v1");
    expect(accepted.decisions).toEqual([
      {
        versionId: "v1",
        decision: "accepted",
        decidedAt: T2,
        clientName: "Ana Popescu",
      },
    ]);
  });

  it("a doua decizie pe aceeași versiune e refuzată, cu data primei decizii", () => {
    const accepted = ok(
      decideVersion(sentV1(), "v1", "accepted", T2, "Ana Popescu"),
    );
    const expected = {
      ok: false,
      error: { code: "already_decided", decidedAt: T2 },
    };
    expect(
      decideVersion(accepted, "v1", "accepted", T3, "Ana Popescu"),
    ).toEqual(expected);
    expect(
      decideVersion(accepted, "v1", "rejected", T3, "Ana Popescu"),
    ).toEqual(expected);
    expect(accepted.decisions).toHaveLength(1);
  });

  it("respingerea fără versiune anterioară: nimic în vigoare", () => {
    const rejected = ok(
      decideVersion(sentV1(), "v1", "rejected", T2, "Ana Popescu"),
    );
    expect(versionInForce(rejected)).toBeNull();
  });

  it("o ciornă sau o versiune inexistentă nu pot fi decise", () => {
    const draft = ok(createDraftVersion(emptyProposal(), "v1", content()));
    expect(decideVersion(draft, "v1", "accepted", T2, "Ana").ok).toBe(false);
    expect(decideVersion(draft, "nu-exista", "accepted", T2, "Ana")).toEqual({
      ok: false,
      error: { code: "version_not_found" },
    });
  });

  it("după expirare decizia e refuzată, iar versiunea devine „expirată”", () => {
    expect(decideVersion(sentV1(), "v1", "accepted", AFTER, "Ana")).toEqual({
      ok: false,
      error: { code: "expired", expiresAt: LATER },
    });
    const expired = expireVersions(sentV1(), AFTER);
    expect(expired.versions[0].state).toBe("expired");
    expect(expireVersions(sentV1(), T2).versions[0].state).toBe("sent");
  });
});

describe("modificarea unui supliment acceptat", () => {
  it("versiunea veche rămâne în vigoare cât timp cea nouă e doar trimisă", () => {
    expect(versionInForce(acceptedV1SentV2())?.id).toBe("v1");
  });

  it("versiunea nouă acceptată o înlocuiește pe cea veche", () => {
    const both = ok(
      decideVersion(acceptedV1SentV2(), "v2", "accepted", T3, "Ana Popescu"),
    );
    expect(versionInForce(both)).toMatchObject({ id: "v2", priceExVat: 80000 });
  });

  it("versiunea nouă respinsă lasă versiunea veche în vigoare", () => {
    const rejected = ok(
      decideVersion(acceptedV1SentV2(), "v2", "rejected", T3, "Ana Popescu"),
    );
    expect(versionInForce(rejected)?.id).toBe("v1");
  });

  it("versiunea nouă expirată sau retrasă lasă versiunea veche în vigoare", () => {
    expect(versionInForce(expireVersions(acceptedV1SentV2(), AFTER))?.id).toBe(
      "v1",
    );
    expect(
      versionInForce(ok(cancelVersion(acceptedV1SentV2(), "v2")))?.id,
    ).toBe("v1");
  });

  it("o versiune acceptată nu poate fi retrasă", () => {
    expect(cancelVersion(acceptedV1SentV2(), "v1")).toEqual({
      ok: false,
      error: { code: "not_open", state: "accepted" },
    });
  });
});
