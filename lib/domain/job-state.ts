/** Mașina de stări a unei lucrări: ce treceri dintr-o stare în alta sunt permise. */
import type { JobState, Result } from "./types";

const TRANSITIONS: Record<JobState, readonly JobState[]> = {
  planned: ["active", "cancelled"],
  active: ["paused", "done", "cancelled"],
  paused: ["active", "cancelled"],
  // Stări finale. Redeschiderea unei lucrări finalizate nu e definită în plan (decizie deschisă).
  done: [],
  cancelled: [],
};

export function allowedJobTransitions(from: JobState): readonly JobState[] {
  return TRANSITIONS[from];
}

export function canTransitionJob(from: JobState, to: JobState): boolean {
  return TRANSITIONS[from].includes(to);
}

export type JobTransitionError = {
  code: "transition_not_allowed";
  from: JobState;
  to: JobState;
};

export function transitionJob(
  from: JobState,
  to: JobState,
): Result<JobState, JobTransitionError> {
  if (!canTransitionJob(from, to)) {
    return { ok: false, error: { code: "transition_not_allowed", from, to } };
  }
  return { ok: true, value: to };
}

/** La finalizată/anulată costul estimat rămas se consideră 0 (plan, „Formule”). */
export function isJobClosed(state: JobState): boolean {
  return state === "done" || state === "cancelled";
}
