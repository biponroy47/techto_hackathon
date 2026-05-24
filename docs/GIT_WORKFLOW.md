# Git Workflow for the Hackathon

This guide is for teammates with minimal Git experience. Follow it closely and ask for help before using commands you do not recognize.

## One-Time Setup

Clone the repo:

```bash
git clone https://github.com/biponroy47/techto_hackathon.git
cd techto_hackathon
```

Install dependencies from the project root:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:8787/api/health`

Backend teammates should also create a local environment file:

```bash
cp backend/.env.example backend/.env
```

Do not commit `.env`. It is ignored on purpose because it can contain secret API keys.

To use the real chatbot, add a free Groq API key in `backend/.env`:

```bash
GROQ_API_KEY=your-groq-api-key
```

## Who Works Where

Frontend team:

- Work inside `frontend/`.
- Main files are in `frontend/src/`.
- Pages live in `frontend/src/pages/`.
- Shared frontend types are in `frontend/src/types.ts`.
- Styling is in `frontend/src/styles.css`.

Backend team:

- Work inside `backend/`.
- Main server file is `backend/src/server.ts`.
- API routes currently live in `backend/src/server.ts`.
- Environment variables are in `backend/.env`.

Try not to edit files outside your folder unless the team agrees. This reduces merge conflicts.

## Daily Starting Routine

Before starting work, update your local copy:

```bash
git checkout main
git pull
```

Then create your own branch:

```bash
git checkout -b feature/your-short-feature-name
```

Examples:

```bash
git checkout -b feature/onboarding-validation
git checkout -b feature/chat-loading-state
git checkout -b feature/openai-prompt
git checkout -b fix/backend-error-message
```

Use lowercase names with hyphens. Keep names short and clear.

## Making Changes

Run the app while you work:

```bash
npm run dev
```

Useful focused commands:

```bash
npm run dev:frontend
npm run dev:backend
```

Before committing, check your work:

```bash
npm run typecheck
npm run lint
```

If you changed both frontend and backend, also run:

```bash
npm run build
```

## Saving Your Work with Commits

See what changed:

```bash
git status
```

See the actual code changes:

```bash
git diff
```

Stage only the files you meant to change:

```bash
git add frontend/src/pages/ChatPage.tsx
```

Or stage a whole folder if all changes inside it are yours:

```bash
git add frontend/
git add backend/
```

Commit with a short message:

```bash
git commit -m "Add chat loading state"
```

Good commit messages:

- `Add onboarding form validation`
- `Connect chat page to backend`
- `Improve backend AI prompt`
- `Fix empty profile handling`

Avoid vague messages like:

- `changes`
- `stuff`
- `final`
- `fix`

## Pushing Your Branch

The first time you push a new branch:

```bash
git push -u origin feature/your-short-feature-name
```

After that, if you make more commits on the same branch:

```bash
git push
```

## Opening a Pull Request

After pushing, GitHub will usually show a button to open a pull request.

Use:

- Base branch: `main`
- Compare branch: your feature branch

In the pull request description, include:

- What you changed
- How you tested it
- Anything unfinished or risky

Example:

```text
What changed:
- Added loading and error states to the chat page.
- Added quick prompt buttons.

Tested:
- Ran npm run typecheck.
- Ran npm run lint.
- Tested chat page locally at localhost:5173.

Notes:
- Backend still uses mock mode without an API key.
```

## Getting Teammates' Latest Changes

If someone merged changes into `main`, update your branch:

```bash
git checkout main
git pull
git checkout feature/your-short-feature-name
git merge main
```

If Git says there is a conflict, stop and ask the team for help. Do not randomly delete code to make the conflict go away.

## Simple Conflict Rule

Conflicts are most likely when two people edit the same file.

To avoid this:

- Frontend teammates should divide pages/components before coding.
- Backend teammates should discuss API route changes first.
- Tell the team before editing shared files like `package.json`, `README.md`, or `frontend/src/types.ts`.

## Pull Request Review Checklist

Before asking for review:

```bash
git status
npm run typecheck
npm run lint
```

Check:

- The app still starts with `npm run dev`.
- Your branch only includes files related to your task.
- You did not commit `.env`, `node_modules`, or `dist`.
- The pull request explains how to test the change.

## Common Git Problems

### I forgot to make a branch and changed files on main

Do this before committing:

```bash
git checkout -b feature/your-short-feature-name
```

Your changes will move with you onto the new branch.

### I want to cancel changes in one file

Only do this if you are sure you do not need your local edits:

```bash
git restore path/to/file
```

### I need to see what branch I am on

```bash
git branch
```

The current branch has a `*` next to it.

### I need to switch branches but Git says I have changes

First check what changed:

```bash
git status
```

Then either commit your work or ask for help. Do not use `git reset --hard` unless the team explicitly agrees.

## Recommended Hackathon Rhythm

1. Start from updated `main`.
2. Create a small branch.
3. Make one focused change.
4. Test locally.
5. Commit and push.
6. Open a pull request.
7. Merge quickly once one teammate reviews it.

Small branches keep everyone moving.
