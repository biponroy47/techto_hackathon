# TechTO Hackathon Finance Consultant

A beginner-friendly hackathon app for turning a user's financial context into practical planning help.

## Product Scope

For the first build, keep it to two pages:

1. **Onboarding**: collect financial context such as job, income, expenses, goals, debts, subscriptions, and upcoming costs.
2. **AI Consultant Chat**: use the onboarding answers as context so the assistant can suggest budgets, savings plans, and next steps.

## Recommended Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **AI**: OpenAI API through the backend
- **Database for demo**: browser localStorage first
- **Database after demo works**: Supabase table for user profiles and chat sessions

For a hackathon, build the happy path first. localStorage is fine for the first demo because it keeps the product moving. Add Supabase once the screens and AI flow are working.

## Project Structure

```text
techto_hackathon/
  frontend/       React app with onboarding and chatbot pages
  backend/        Express API that calls the AI model
  docs/           Hackathon plan, feature priorities, and team workflow
```

## Setup

```bash
npm install
cp .env.example backend/.env
npm run dev
```

Open the frontend at `http://localhost:5173`.

The backend runs at `http://localhost:8787`.

## Team Workflow

Create feature branches from `main`:

```bash
git checkout -b feature/onboarding-form
git checkout -b feature/chat-api
git checkout -b feature/chat-ui
```

Keep pull requests small. During the hackathon, merge working slices quickly instead of waiting for perfection.

