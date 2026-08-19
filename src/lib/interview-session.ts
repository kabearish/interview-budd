import type { InterviewReport } from "./interview.functions";

const KEY = "interviewpilot:report";

export type StoredSession = {
  role: string;
  report: InterviewReport;
};

export function saveSession(session: StoredSession) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export const ROLES = [
  {
    slug: "sde-intern",
    title: "SDE Intern",
    blurb: "Data structures, problem solving and internship-level behaviourals.",
    focus: ["Algorithms", "Debugging", "Teamwork"],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    blurb: "SQL, statistics, dashboards and turning numbers into decisions.",
    focus: ["SQL", "Statistics", "Storytelling"],
  },
  {
    slug: "frontend-developer",
    title: "Frontend Developer",
    blurb: "JavaScript, React, accessibility and performance trade-offs.",
    focus: ["React", "CSS", "Performance"],
  },
] as const;

export function roleFromSlug(slug: string) {
  return ROLES.find((r) => r.slug === slug) ?? null;
}
