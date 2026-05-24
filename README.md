# TechTO Hackathon Finance Consultant

A beginner-friendly hackathon app for turning a user's financial context into practical planning help.

## Product Scope

For the first build, keep it to two pages:

1. **Onboarding**: collect financial context such as job, income, expenses, goals, debts, subscriptions, and upcoming costs.
2. **AI Consultant Chat**: use the onboarding answers as context so the assistant can suggest budgets, savings plans, and next steps.

## Recommended Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **AI**: Groq API through the backend
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

Clone the repo:

```bash
git clone https://github.com/biponroy47/techto_hackathon.git
cd techto_hackathon
```

Install everything from the project root:

```bash
npm install
npm run dev
```

Open the frontend at `http://localhost:5173`.

The backend runs at `http://localhost:8787`.

If you are working on AI/backend features, create your local backend env file:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and add a real `GROQ_API_KEY` if you have one. The app still runs in mock mode without a real key.

## Team Workflow

Frontend team: work inside `frontend/`.

Backend team: work inside `backend/`.

Everyone should read the step-by-step Git guide before changing files:

- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)

Quick version:

```bash
git checkout main
git pull
git checkout -b feature/short-description
# make changes
git status
git add path/to/changed-file
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Then open a pull request on GitHub into `main`.
