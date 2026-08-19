import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { generateQuestions, gradeInterview } from "@/lib/interview.functions";
import { roleFromSlug, saveSession } from "@/lib/interview-session";

export const Route = createFileRoute("/interview/$role")({
  head: () => ({
    meta: [
      { title: "Mock Interview Session — InterviewPilot" },
      {
        name: "description",
        content:
          "Answer five timed AI-generated interview questions in a focused chat session and get scored instantly.",
      },
      { property: "og:title", content: "Mock Interview Session — InterviewPilot" },
      {
        property: "og:description",
        content: "A timed AI mock interview chat with instant scoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterviewPage,
});

type Turn = { role: "interviewer" | "candidate"; content: string };

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function InterviewPage() {
  const { role: slug } = Route.useParams();
  const navigate = useNavigate();
  const roleInfo = roleFromSlug(slug);
  const roleTitle = roleInfo?.title ?? "Candidate";

  const askQuestions = useServerFn(generateQuestions);
  const grade = useServerFn(gradeInterview);

  const [questions, setQuestions] = useState<string[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answersRef = useRef<{ question: string; answer: string; seconds: number }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!roleInfo || started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await askQuestions({ data: { role: roleTitle } });
        setQuestions(res.questions);
        setTurns([
          {
            role: "interviewer",
            content: `Hi! I'll be your interviewer for the **${roleTitle}** role. There are ${res.questions.length} questions — take your time, the timer is just for awareness.\n\n**Question 1.** ${res.questions[0]}`,
          },
        ]);
      } catch (e) {
        console.error(e);
        setError("Couldn't start the interview. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [askQuestions, roleInfo, roleTitle]);

  useEffect(() => {
    if (loading || submitting) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading, submitting, index]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, submitting]);

  const progress = useMemo(
    () => (questions.length ? (index / questions.length) * 100 : 0),
    [index, questions.length],
  );

  if (!roleInfo) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="surface-card p-8 text-center">
          <h1 className="text-xl font-semibold">Unknown role</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            Pick a role
          </Link>
        </div>
      </main>
    );
  }

  async function submitAnswer() {
    const answer = draft.trim();
    if (!answer || submitting || questions.length === 0) return;
    answersRef.current.push({ question: questions[index] ?? "", answer, seconds });
    setTurns((t) => [...t, { role: "candidate", content: answer }]);
    setDraft("");

    const next = index + 1;
    if (next < questions.length) {
      setIndex(next);
      setSeconds(0);
      setTurns((t) => [
        ...t,
        { role: "interviewer", content: `**Question ${next + 1}.** ${questions[next] ?? ""}` },
      ]);
      return;
    }

    setSubmitting(true);
    setTurns((t) => [
      ...t,
      { role: "interviewer", content: "That's the last one. Scoring your interview now…" },
    ]);
    try {
      const report = await grade({ data: { role: roleTitle, answers: answersRef.current } });
      saveSession({ role: roleTitle, report });
      navigate({ to: "/report/$role", params: { role: slug } });
    } catch (e) {
      console.error(e);
      setError("Scoring failed. Please try the interview again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="navy-panel">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-navy-foreground/70 transition-colors hover:text-navy-foreground"
          >
            <ArrowLeft className="size-4" /> Exit
          </Link>
          <div className="text-center">
            <p className="font-display text-sm font-semibold text-navy-foreground">{roleTitle}</p>
            <p className="text-xs text-navy-foreground/60">
              {questions.length ? `Question ${index + 1} of ${questions.length}` : "Preparing…"}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-navy-foreground/10 px-3 py-1 font-mono text-sm text-navy-foreground">
            <Clock className="size-4" /> {formatTime(seconds)}
          </span>
        </div>
        <div className="h-1 w-full bg-navy-foreground/10">
          <div
            className="h-full bg-navy-foreground/70 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
        {loading && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Preparing your questions…
          </p>
        )}
        {error && (
          <div className="surface-card border-destructive/40 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {turns.map((turn, i) =>
          turn.role === "interviewer" ? (
            <div key={i} className="flex gap-3">
              <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-navy-foreground">
                IP
              </span>
              <div className="prose prose-sm max-w-none text-foreground prose-strong:text-foreground">
                <ReactMarkdown>{turn.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                {turn.content}
              </p>
            </div>
          ),
        )}
        {submitting && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Building your report card…
          </p>
        )}
        <div ref={bottomRef} />
      </section>

      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <form
          className="mx-auto flex w-full max-w-3xl items-end gap-3 px-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitAnswer();
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submitAnswer();
              }
            }}
            rows={3}
            disabled={loading || submitting}
            placeholder="Type your answer… (Cmd/Ctrl + Enter to send)"
            className="min-h-[76px] flex-1 resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || submitting || !draft.trim()}
            className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            aria-label="Send answer"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
