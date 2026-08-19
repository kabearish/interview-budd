import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-2.5-flash";

const QuestionsInput = z.object({ role: z.string().min(1) });

const QuestionsSchema = z.object({
  questions: z.array(z.string()).min(5).max(5),
});

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuestionsInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    try {
    const result = await generateText({
      model: gateway(MODEL),
      output: Output.object({ schema: QuestionsSchema }),
      system:
        "You are a senior technical interviewer. Produce realistic, concise interview questions.",
      prompt: `Generate exactly 5 mock interview questions for a "${data.role}" candidate. Mix behavioural and role-specific technical questions, ordered easy to hard. Each question must be a single sentence under 30 words.`,
    });

    return await result.output;
    } catch (e) {
      console.error("[generateQuestions]", e);
      throw e;
    }
  });

const ReportInput = z.object({
  role: z.string().min(1),
  answers: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        seconds: z.number(),
      }),
    )
    .min(1),
});

const ReportSchema = z.object({
  overallScore: z.number(),
  summary: z.string(),
  perQuestion: z.array(
    z.object({
      question: z.string(),
      score: z.number(),
      feedback: z.string(),
      modelAnswer: z.string(),
    }),
  ),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export type InterviewReport = z.infer<typeof ReportSchema>;

export const gradeInterview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReportInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const transcript = data.answers
      .map(
        (a, i) =>
          `Q${i + 1}: ${a.question}\nAnswer (${a.seconds}s taken): ${a.answer || "(no answer given)"}`,
      )
      .join("\n\n");

    const result = await generateText({
      model: gateway(MODEL),
      output: Output.object({ schema: ReportSchema }),
      system:
        "You are a fair but rigorous interview evaluator. Scores are integers 0-100. Be specific and actionable.",
      prompt: `Evaluate this mock interview for the role "${data.role}".\n\n${transcript}\n\nReturn a score 0-100 per question, short feedback (max 2 sentences), and a strong model answer (3-5 sentences) for each question. Also give an overall score, a 2-sentence summary, 3 strengths and 3 weaknesses.`,
    });

    return await result.output;
  });
