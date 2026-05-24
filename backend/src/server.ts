import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { z } from "zod";

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

function buildProfileSummary(profile: z.infer<typeof profileSchema>) {
  return Object.entries(profile)
    .filter(([, value]) => value && value.trim().length > 0)
    .map(([key, value]) => `${labelForProfileKey(key)}: ${formatProfileValue(key, value ?? "")}`)
    .join("\n");
}

function labelForProfileKey(key: string) {
  const labels: Record<string, string> = {
    fullName: "Name",
    occupation: "Occupation",
    status: "Current situation",
    monthlyIncome: "Monthly income",
    housingCost: "Rent or housing cost",
    subscriptions: "Subscriptions",
    recurringExpenses: "Recurring expenses",
    debts: "Debts",
    upcomingExpenses: "Upcoming expenses",
    savingsGoals: "Savings goals"
  };

  return labels[key] ?? key;
}

function formatProfileValue(key: string, value: string) {
  if (!["subscriptions", "recurringExpenses", "debts", "upcomingExpenses", "savingsGoals"].includes(key)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return "None listed";
    }

    return parsed.map((item) => formatListItem(key, item)).join("; ");
  } catch {
    return value;
  }
}

function formatListItem(key: string, item: unknown) {
  if (!item || typeof item !== "object") {
    return String(item);
  }

  const record = item as Record<string, unknown>;
  const name = valueOrFallback(record.name, "Unnamed");

  if (key === "subscriptions" || key === "recurringExpenses") {
    return `${name} costs $${valueOrFallback(record.cost, "0")} ${valueOrFallback(record.basis, "monthly")} on ${valueOrFallback(record.recurringDate, "unspecified date")}`;
  }

  if (key === "debts") {
    const interest = record.interestRate ? ` at ${record.interestRate}% interest` : "";
    return `${name} ${valueOrFallback(record.type, "debt")} balance $${valueOrFallback(record.amount, "0")}${interest}`;
  }

  if (key === "upcomingExpenses") {
    return `${name} ${valueOrFallback(record.type, "expense")} costs $${valueOrFallback(record.cost, "0")} on ${valueOrFallback(record.date, "unspecified date")}`;
  }

  if (key === "savingsGoals") {
    const target = record.target ? ` by ${record.target}` : "";
    return `${name} ${valueOrFallback(record.type, "goal")} target $${valueOrFallback(record.amount, "0")}${target}`;
  }

  return name;
}

function valueOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function buildMockAdvice(message: string, profile: z.infer<typeof profileSchema>) {
  const income = profile.monthlyIncome ? `$${profile.monthlyIncome}/month` : "your current income";

  return [
    `Based on ${income}, start with a simple 50/30/20 budget: needs, wants, and savings/debt repayment.`,
    "Add your Groq API key in backend/.env to get personalized AI responses.",
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

  if (!groq) {
    return res.json({
      reply: buildMockAdvice(message, profile),
      mode: "mock"
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are FiHo, a careful personal financial guidance assistant. Give practical, beginner-friendly budgeting, cash flow, debt, and savings guidance. Do not claim to be a licensed financial advisor. Avoid legal, tax, or investment guarantees. Keep answers specific, structured, and concise."
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
