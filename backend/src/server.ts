import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { z } from "zod";
import {
  buildUserChatMessage,
  FINANCE_ASSISTANT_SYSTEM_PROMPT,
  formatProfileForPrompt
} from "./prompts.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

const groqApiKey = process.env.GROQ_API_KEY?.trim();
const hasRealGroqKey =
  groqApiKey && !["replace-me", "your-groq-api-key-here"].includes(groqApiKey);

const groq = hasRealGroqKey
  ? new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1"
    })
  : null;

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "1mb" }));

const profileSchema = z.object({
  fullName: z.string().optional(),
  occupation: z.string().optional(),
  status: z.string().optional(),
  monthlyIncome: z.string().optional(),
  housingCost: z.string().optional(),
  subscriptions: z.string().optional(),
  recurringExpenses: z.string().optional(),
  debts: z.string().optional(),
  upcomingExpenses: z.string().optional(),
  savingsGoals: z.string().optional()
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  profile: profileSchema
});

function buildMockAdvice(message: string, profile: z.infer<typeof profileSchema>) {
  const income = profile.monthlyIncome ? `$${profile.monthlyIncome}/month` : "your current income";

  return [
    `Based on ${income}, a simple starting point is a **50/30/20** split: needs, wants, and savings or debt repayment.`,
    "For personalized AI answers, add your Groq API key in `backend/.env`.",
    `For your question about "${message}", list your fixed costs first, then pick **one** savings goal and **one** expense to trim this week.`
  ].join("\n\n");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid chat request." });
  }

  const { message, profile } = parsed.data;
  const profileSummary = formatProfileForPrompt(profile);

  if (!groq) {
    return res.json({
      reply: buildMockAdvice(message, profile),
      mode: "mock"
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      messages: [
        { role: "system", content: FINANCE_ASSISTANT_SYSTEM_PROMPT },
        { role: "user", content: buildUserChatMessage(message, profileSummary) }
      ]
    });

    res.json({
      reply:
        completion.choices[0]?.message?.content ??
        "I could not generate a response. Please try again.",
      mode: "groq"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
