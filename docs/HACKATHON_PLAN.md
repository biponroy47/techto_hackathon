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
  - localStorage for demo profile
  |
  | POST /api/chat
  v
backend/
  - Express API
  - builds a finance-consultant prompt
  - calls AI provider
```

## Why This Stack

- React + Vite is fast to start, easy to demo, and familiar to many beginners.
- Express keeps backend code explicit and simple.
- TypeScript catches common mistakes without making the stack too heavy.
- localStorage avoids database setup friction in the first hour.
- Supabase can be added later without changing the product concept.

## Prioritized Features

### P0: Must Have

1. Repo and app scaffold.
2. Onboarding form with fields for:
   - occupation or student status
   - monthly income
   - monthly rent or housing
   - subscriptions
   - recurring expenses
   - debts
   - upcoming expenses
   - savings goals
3. Save onboarding answers locally.
4. Chat page loads the saved profile.
5. Backend `/api/chat` endpoint.
6. AI response uses the user's financial context.
7. Clear disclaimer that responses are educational, not professional financial advice.

### P1: Strong Demo Improvements

1. Suggested quick prompts on the chat page.
2. Budget summary card beside the chat.
3. Profile completeness indicator.
4. Reset/edit onboarding flow.
5. Better loading and error states.

### P2: Stretch

1. Supabase authentication.
2. Supabase `profiles` and `chat_messages` tables.
3. Upload CSV transaction files.
4. Parse transactions into monthly inflow/outflow summaries.
5. Calendar view for money in and money out.
6. Export a budget plan.

## Suggested Team Split

### Person 1: Frontend Onboarding

- Build the form.
- Validate numeric fields.
- Save and load from localStorage.
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
2. Make onboarding save a profile.
3. Make chat send a hardcoded message to the backend.
4. Make backend return a mock response.
5. Add real AI API key.
6. Include onboarding context in AI prompt.
7. Polish UI and demo script.
8. Add Supabase only if the core demo is already working.

## Demo Script

1. "I am a student with part-time income and a trip coming up."
2. Fill onboarding with realistic data.
3. Ask: "Can I afford a $1,200 trip in 4 months?"
4. Ask: "Create a weekly budget for me."
5. Ask: "What subscriptions or expenses should I review first?"

## Supabase Later

Add these tables when ready:

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  occupation text,
  monthly_income numeric,
  housing_cost numeric,
  recurring_expenses text,
  subscriptions text,
  debts text,
  upcoming_expenses text,
  savings_goals text
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
```

