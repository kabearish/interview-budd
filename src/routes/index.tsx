import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Target, MessageSquare } from "lucide-react";
import { ROLES } from "@/lib/interview-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewPilot — AI Mock Interview Practice" },
      {
        name: "description",
        content:
          "Practice realistic mock interviews for SDE Intern, Data Analyst and Frontend Developer roles, with timed questions and an AI-scored report card.",
      },
      { property: "og:title", content: "InterviewPilot — AI Mock Interview Practice" },
      {
        property: "og:description",
        content: "Timed AI mock interviews with per-question scoring and model answers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <header className="navy-panel">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-navy-foreground/60">
            InterviewPilot
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold text-navy-foreground md:text-5xl">
            Rehearse the interview before it happens.
          </h1>
          <p className="mt-4 max-w-xl text-navy-foreground/70">
            Five timed questions, one AI interviewer, and a report card that tells you exactly what
            to fix.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-navy-foreground/70">
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="size-4" /> Adaptive question set
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4" /> Per-question timer
            </span>
            <span className="inline-flex items-center gap-2">
              <Target className="size-4" /> Scored feedback
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-lg font-semibold text-foreground">Choose your role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Questions are generated for the role you pick.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ROLES.map((role) => (
            <Link
              key={role.slug}
              to="/interview/$role"
              params={{ role: role.slug }}
              className="surface-card group flex flex-col p-6 transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-foreground">{role.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{role.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {role.focus.map((f) => (
                  <li
                    key={f}
                    className="rounded-full bg-navy-soft px-3 py-1 text-xs font-medium text-navy"
                  >
                    {f}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Start interview
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
