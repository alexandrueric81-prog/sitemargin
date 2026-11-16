import { describe, expect, it } from "vitest";
import {
  allowedJobTransitions,
  canTransitionJob,
  isJobClosed,
  transitionJob,
} from "./job-state";

describe("stările unei lucrări", () => {
  it("permite traseul obișnuit: planificată → activă → pauză → activă → finalizată", () => {
    expect(canTransitionJob("planned", "active")).toBe(true);
    expect(canTransitionJob("active", "paused")).toBe(true);
    expect(canTransitionJob("paused", "active")).toBe(true);
    expect(canTransitionJob("active", "done")).toBe(true);
  });

  it("refuză salturile: planificată sau pauză direct la finalizată", () => {
    expect(transitionJob("planned", "done")).toEqual({
      ok: false,
      error: { code: "transition_not_allowed", from: "planned", to: "done" },
    });
    expect(canTransitionJob("paused", "done")).toBe(false);
  });

  it("finalizată și anulată sunt stări finale", () => {
    expect(allowedJobTransitions("done")).toEqual([]);
    expect(allowedJobTransitions("cancelled")).toEqual([]);
    expect(isJobClosed("done")).toBe(true);
    expect(isJobClosed("cancelled")).toBe(true);
    expect(isJobClosed("paused")).toBe(false);
  });

  it("orice lucrare neînchisă se poate anula", () => {
    for (const state of ["planned", "active", "paused"] as const) {
      expect(transitionJob(state, "cancelled")).toEqual({
        ok: true,
        value: "cancelled",
      });
    }
  });
});
