# Hackathon Build Plan

## North Star

Build a two-page financial consultant demo:

1. The user enters their financial situation.
2. The chatbot uses that context to give useful, specific financial planning advice.

This is not a regulated financial advisor. The app should frame responses as educational guidance and recommend consulting a professional for major decisions.

## Architecture

```text
Browser
  |
  | React pages
  v
frontend/
  - Onboarding page
  - Chat page
  - Supabase Auth session
  - Supabase profile storage
  |
  | POST /api/chat
  v
backend/
  - Express API
  - builds a finance-consultant prompt
  - calls Groq's OpenAI-compatible API
```

## Why This Stack

- React + Vite is fast to start, easy to demo, and familiar to many beginners.
- Express keeps backend code explicit and simple.
- TypeScript catches common mistakes without making the stack too heavy.
- Groq has a free API tier that is useful for hackathon testing.
- Supabase gives each user their own onboarding profile without needing to build auth from scratch.

## Prioritized Features

### P0: Must Have

1. Repo and app scaffold.
2. Account signup/login with name, email, and password.
3. Onboarding form with fields for:
   - occupation or student status
   - monthly income
   - monthly rent or housing
   - subscriptions
   - recurring expenses
   - debts
   - upcoming expenses
   - savings goals
4. Save onboarding answers to the user's Supabase profile.
5. Chat page loads the saved profile.
6. Backend `/api/chat` endpoint.
7. AI response uses the user's financial context.
8. Clear disclaimer that responses are educational, not professional financial advice.

### P1: Strong Demo Improvements

1. Suggested quick prompts on the chat page.
2. Budget summary card beside the chat.
3. Profile completeness indicator.
4. Reset/edit onboarding flow.
5. Better loading and error states.

### P2: Stretch

1. Supabase `chat_messages` table.
2. Upload CSV transaction files.
3. Parse transactions into monthly inflow/outflow summaries.
4. Calendar view for money in and money out.
5. Export a budget plan.

## Suggested Team Split

### Person 1: Frontend Onboarding

- Build the form.
- Validate numeric fields.
- Save and load the user's Supabase profile.
- Add edit/reset behavior.

### Person 2: Frontend Chat

- Build message UI.
- Add quick prompts.
- Show profile summary.
- Handle loading and error states.

### Person 3: Backend + AI

- Implement `/api/chat`.
- Add prompt guardrails and disclaimer.
- Test API with curl or Postman.
- Add `.env` setup.

### Person 4: Polish + Demo

- Improve copy and styling.
- Prepare sample user data.
- Test the full demo flow.
- Write the presentation story.

## Build Order

1. Run the app locally.
2. Create the Supabase project and run the SQL in `docs/SUPABASE_SETUP.md`.
3. Make signup/login work.
4. Make onboarding save a profile.
5. Make chat send a message and saved profile to the backend.
6. Make backend return a mock response.
7. Add real Groq API key.
8. Polish UI and demo script.

## Demo Script

1. "I am a student with part-time income and a trip coming up."
2. Fill onboarding with realistic data.
3. Ask: "Can I afford a $1,200 trip in 4 months?"
4. Ask: "Create a weekly budget for me."
5. Ask: "What subscriptions or expenses should I review first?"

## Supabase Stretch

Add chat history when ready:

```sql
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chat_messages enable row level security;
```
