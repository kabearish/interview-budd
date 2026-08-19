import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { loadSession, type StoredSession } from "@/lib/interview-session";

export const Route = createFileRoute("/report/$role")({
  head: () => ({
    meta: [
      { title: "Interview Report Card — InterviewPilot" },
      {
        name: "description",
        content:
          "Your scored mock interview report: per-question scores, strengths, weaknesses and a model answer for every question.",
      },
      { property: "og:title", content: "Interview Report Card — InterviewPilot" },
      {
        property: "og:description",
        content: "Per-question scores, strengths, weaknesses and model answers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function ReportPage() {
  const { role: slug } = Route.useParams();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  if (!ready) return <main className="min-h-screen bg-background" />;

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="surface-card max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">No report yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete a mock interview to see your report card.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Start an interview
          </Link>
        </div>
      </main>
    );
  }

  const { report, role } = session;

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="navy-panel">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-navy-foreground/70 hover:text-navy-foreground"
          >
            <ArrowLeft className="size-4" /> Back to roles
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-navy-foreground/60">
                Report card
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-navy-foreground md:text-4xl">
                {role}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-navy-foreground/70">{report.summary}</p>
            </div>
            <div className="rounded-2xl bg-navy-foreground/10 px-8 py-5 text-center">
              <p className="font-display text-5xl font-bold text-navy-foreground">
                {Math.round(report.overallScore)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-navy-foreground/60">
                Overall
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 py-10 md:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-success" /> Strengths
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-success">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <AlertTriangle className="size-4 text-warning" /> Areas to improve
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warning">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-5 px-6">
        <h2 className="text-lg font-semibold text-foreground">Question breakdown</h2>
        {report.perQuestion.map((q, i) => (
          <article key={i} className="surface-card p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold text-foreground">
                <span className="text-muted-foreground">Q{i + 1}.</span> {q.question}
              </h3>
              <span className={`font-display text-2xl font-bold ${scoreTone(q.score)}`}>
                {Math.round(q.score)}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${q.score}%` }} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{q.feedback}</p>
            <div className="mt-4 rounded-xl bg-navy-soft p-4">
              <p className="font-display text-xs font-semibold uppercase tracking-widest text-navy">
                Model answer
              </p>
              <p className="mt-2 text-sm text-foreground">{q.modelAnswer}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="mx-auto mt-10 max-w-4xl px-6">
        <Link
          to="/interview/$role"
          params={{ role: slug }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <RotateCcw className="size-4" /> Retake this interview
        </Link>
      </div>
    </main>
  );
}
