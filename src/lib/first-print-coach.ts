const COACH_KEY = "pizero.coach.v1";

export type CoachState = {
  orbitDismissed?: boolean;
  portsDismissed?: boolean;
};

function read(): CoachState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COACH_KEY);
    return raw ? (JSON.parse(raw) as CoachState) : {};
  } catch {
    return {};
  }
}

function write(next: CoachState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COACH_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function loadCoach(): CoachState {
  return read();
}

export function dismissCoach(key: keyof CoachState) {
  const next = { ...read(), [key]: true };
  write(next);
  return next;
}
