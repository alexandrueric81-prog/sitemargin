/**
 * Mașina de stări a suplimentelor (docs/plan.md, „Modificarea unui supliment acceptat”).
 * Funcții pure: primesc suplimentul și întorc unul nou, fără să modifice originalul.
 */
import type {
  Id,
  IsoDateTime,
  ProposalAggregate,
  ProposalDecision,
  ProposalVersion,
  ProposalVersionContent,
  ProposalVersionState,
  Result,
} from "./types";

export type ProposalError =
  | { code: "version_not_found" }
  | { code: "draft_exists"; versionId: Id }
  | { code: "not_draft"; state: ProposalVersionState }
  | { code: "not_open"; state: ProposalVersionState }
  | { code: "already_decided"; decidedAt: IsoDateTime }
  | { code: "expired"; expiresAt: IsoDateTime }
  | { code: "invalid_expiry" };

type ProposalResult = Result<ProposalAggregate, ProposalError>;

const fail = (error: ProposalError): ProposalResult => ({ ok: false, error });

function replaceVersion(
  agg: ProposalAggregate,
  updated: ProposalVersion,
): ProposalVersion[] {
  return agg.versions.map((version) =>
    version.id === updated.id ? updated : version,
  );
}

/**
 * Versiunea „în vigoare”: cea acceptată cu numărul cel mai mare. Exact una sau niciuna.
 * Doar ea intră în valoarea contractată și în buget; versiunile nu se adună niciodată.
 */
export function versionInForce(agg: ProposalAggregate): ProposalVersion | null {
  return agg.versions
    .filter((version) => version.state === "accepted")
    .reduce<ProposalVersion | null>(
      (best, version) =>
        !best || version.versionNumber > best.versionNumber ? version : best,
      null,
    );
}

/** Versiunea trimisă clientului și încă nedecisă (cel mult una). */
export function pendingVersion(agg: ProposalAggregate): ProposalVersion | null {
  return agg.versions.find((version) => version.state === "sent") ?? null;
}

export function draftVersion(agg: ProposalAggregate): ProposalVersion | null {
  return agg.versions.find((version) => version.state === "draft") ?? null;
}

/** Ciornă nouă. Se poate crea oricând, dar există cel mult o ciornă pe supliment. */
export function createDraftVersion(
  agg: ProposalAggregate,
  versionId: Id,
  content: ProposalVersionContent,
): ProposalResult {
  const existing = draftVersion(agg);
  if (existing) return fail({ code: "draft_exists", versionId: existing.id });
  const versionNumber =
    Math.max(0, ...agg.versions.map((v) => v.versionNumber)) + 1;
  const version: ProposalVersion = {
    ...content,
    id: versionId,
    proposalId: agg.proposal.id,
    versionNumber,
    state: "draft",
    sentAt: null,
    expiresAt: null,
  };
  return { ok: true, value: { ...agg, versions: [...agg.versions, version] } };
}

/** Doar ciornele se pot modifica; versiunile trimise sunt imuabile. */
export function editDraftVersion(
  agg: ProposalAggregate,
  versionId: Id,
  content: ProposalVersionContent,
): ProposalResult {
  const version = agg.versions.find((v) => v.id === versionId);
  if (!version) return fail({ code: "version_not_found" });
  if (version.state !== "draft")
    return fail({ code: "not_draft", state: version.state });
  return {
    ok: true,
    value: {
      ...agg,
      versions: replaceVersion(agg, { ...version, ...content }),
    },
  };
}

/**
 * Trimite ciorna clientului. Versiunile trimise anterior și nedecise devin „anulate”
 * (linkurile lor nu mai sunt valabile). O versiune deja acceptată rămâne în vigoare.
 */
export function sendVersion(
  agg: ProposalAggregate,
  versionId: Id,
  now: IsoDateTime,
  expiresAt: IsoDateTime,
): ProposalResult {
  const version = agg.versions.find((v) => v.id === versionId);
  if (!version) return fail({ code: "version_not_found" });
  if (version.state !== "draft")
    return fail({ code: "not_draft", state: version.state });
  if (expiresAt <= now) return fail({ code: "invalid_expiry" });
  const versions = agg.versions.map((v): ProposalVersion => {
    if (v.id === versionId)
      return { ...v, state: "sent", sentAt: now, expiresAt };
    if (v.state === "sent") return { ...v, state: "cancelled" };
    return v;
  });
  return { ok: true, value: { ...agg, versions } };
}

/** Renunțare la o ciornă sau retragerea unei versiuni trimise și nedecise. */
export function cancelVersion(
  agg: ProposalAggregate,
  versionId: Id,
): ProposalResult {
  const version = agg.versions.find((v) => v.id === versionId);
  if (!version) return fail({ code: "version_not_found" });
  if (version.state !== "draft" && version.state !== "sent") {
    return fail({ code: "not_open", state: version.state });
  }
  return {
    ok: true,
    value: {
      ...agg,
      versions: replaceVersion(agg, { ...version, state: "cancelled" }),
    },
  };
}

/** Marchează ca expirate versiunile trimise al căror termen a trecut. */
export function expireVersions(
  agg: ProposalAggregate,
  now: IsoDateTime,
): ProposalAggregate {
  const versions = agg.versions.map((v): ProposalVersion =>
    v.state === "sent" && v.expiresAt !== null && v.expiresAt < now
      ? { ...v, state: "expired" }
      : v,
  );
  return { ...agg, versions };
}

/**
 * Decizia clientului pe o versiune precisă. O versiune primește o singură decizie:
 * a doua apăsare sau o decizie contrară primesc „already_decided” cu data primei decizii.
 */
export function decideVersion(
  agg: ProposalAggregate,
  versionId: Id,
  decision: ProposalDecision["decision"],
  now: IsoDateTime,
  clientName: string,
): ProposalResult {
  const version = agg.versions.find((v) => v.id === versionId);
  if (!version) return fail({ code: "version_not_found" });
  const previous = agg.decisions.find((d) => d.versionId === versionId);
  if (previous)
    return fail({ code: "already_decided", decidedAt: previous.decidedAt });
  if (version.state !== "sent")
    return fail({ code: "not_open", state: version.state });
  if (version.expiresAt !== null && version.expiresAt < now) {
    return fail({ code: "expired", expiresAt: version.expiresAt });
  }
  return {
    ok: true,
    value: {
      ...agg,
      versions: replaceVersion(agg, { ...version, state: decision }),
      decisions: [
        ...agg.decisions,
        { versionId, decision, decidedAt: now, clientName },
      ],
    },
  };
}
