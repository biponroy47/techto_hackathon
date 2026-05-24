import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";
import {
  buildMockSuggestions,
  buildSuggestionsUserMessage,
  buildUserChatMessage,
  DEFAULT_SUGGESTION_PROMPTS,
  fillSuggestions,
  FINANCE_ASSISTANT_SYSTEM_PROMPT,
  formatProfileForPrompt,
  parseSuggestionsJson,
  SUGGESTIONS_SYSTEM_PROMPT,
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
      baseURL: "https://api.groq.com/openai/v1",
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
  savingsGoals: z.string().optional(),
  netWorthItems: z.string().optional(),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
  profile: profileSchema,
});

const suggestionsRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
  profile: profileSchema,
});

function getLatestUserMessage(messages: z.infer<typeof chatMessageSchema>[]) {
  return [...messages].reverse().find((message) => message.role === "user");
}

function buildCompletionMessages(
  messages: z.infer<typeof chatMessageSchema>[],
  profileSummary: string,
): ChatCompletionMessageParam[] {
  const completionMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: FINANCE_ASSISTANT_SYSTEM_PROMPT },
  ];

  const history = messages.slice(0, -1);
  for (const message of history.slice(-12)) {
    completionMessages.push({ role: message.role, content: message.content });
  }

  const latestUser = getLatestUserMessage(messages);
  if (latestUser) {
    completionMessages.push({
      role: "user",
      content: buildUserChatMessage(latestUser.content, profileSummary),
    });
  }

  return completionMessages;
}

function buildMockAdvice(
  message: string,
  profile: z.infer<typeof profileSchema>,
) {
  const income = profile.monthlyIncome
    ? `$${profile.monthlyIncome}/month`
    : "your current income";

  return [
    `Based on ${income}, a simple starting point is a **50/30/20** split: needs, wants, and savings or debt repayment.`,
    "For personalized AI answers, add your Groq API key in backend/.env.",
    `For your question about "${message}", list your fixed costs first, then pick **one** savings goal and **one** expense to trim this week.`,
  ].join("\n\n");
}

async function generateSuggestions(
  messages: z.infer<typeof chatMessageSchema>[],
  profile: z.infer<typeof profileSchema>,
) {
  const profileSummary = formatProfileForPrompt(profile);

  if (!groq) {
    return {
      suggestions: buildMockSuggestions(messages, profile),
      mode: "mock" as const,
    };
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
    messages: [
      { role: "system", content: SUGGESTIONS_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildSuggestionsUserMessage(messages, profileSummary),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = parseSuggestionsJson(raw);
  const suggestions = fillSuggestions(parsed ?? [], DEFAULT_SUGGESTION_PROMPTS);

  return { suggestions, mode: "groq" as const };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat/suggestions", async (req, res) => {
  const parsed = suggestionsRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid suggestions request." });
  }

  try {
    const result = await generateSuggestions(
      parsed.data.messages,
      parsed.data.profile,
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Suggestions request failed." });
  }
});

app.post("/api/chat", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid chat request." });
  }

  const { messages, profile } = parsed.data;
  const latestUser = getLatestUserMessage(messages);

  if (!latestUser) {
    return res
      .status(400)
      .json({ error: "Last message must be from the user." });
  }

  const profileSummary = formatProfileForPrompt(profile);

  if (!groq) {
    return res.json({
      reply: buildMockAdvice(latestUser.content, profile),
      mode: "mock",
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      messages: buildCompletionMessages(messages, profileSummary),
    });

    res.json({
      reply:
        completion.choices[0]?.message?.content ??
        "I could not generate a response. Please try again.",
      mode: "groq",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
