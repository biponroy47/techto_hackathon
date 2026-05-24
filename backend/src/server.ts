import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "1mb" }));

const profileSchema = z.object({
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

function buildProfileSummary(profile: z.infer<typeof profileSchema>) {
  return Object.entries(profile)
    .filter(([, value]) => value && value.trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function buildMockAdvice(message: string, profile: z.infer<typeof profileSchema>) {
  const income = profile.monthlyIncome ? `$${profile.monthlyIncome}/month` : "your current income";

  return [
    `Based on ${income}, start with a simple 50/30/20 budget: needs, wants, and savings/debt repayment.`,
    "For this hackathon demo, add your OpenAI API key in backend/.env to get personalized AI responses.",
    `A good next step for your question, "${message}", is to list fixed costs first, then choose one savings target and one expense to reduce this week.`
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
  const profileSummary = buildProfileSummary(profile);

  if (!openai) {
    return res.json({
      reply: buildMockAdvice(message, profile),
      mode: "mock"
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a careful financial planning assistant for a hackathon demo. Give practical, beginner-friendly budgeting and planning guidance. Do not claim to be a licensed financial advisor. Avoid legal, tax, or investment guarantees. Keep answers specific, structured, and concise."
        },
        {
          role: "user",
          content: `User financial profile:\n${profileSummary || "No profile provided yet."}\n\nUser question:\n${message}`
        }
      ]
    });

    res.json({
      reply:
        completion.choices[0]?.message?.content ??
        "I could not generate a response. Please try again.",
      mode: "ai"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
