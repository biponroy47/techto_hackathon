# Supabase Setup

Use this when you want real accounts and per-user onboarding profiles.

## 1. Create a Supabase Project

1. Go to `https://supabase.com/dashboard`.
2. Create a new project.
3. Open Project Settings.
4. Copy:
   - Project URL
   - Anon/public API key

Create a local frontend env file from the repo root:

```bash
cp frontend/.env.example frontend/.env.local
```

Fill in `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Restart `npm run dev` after changing env vars.

## 2. Create the Profiles Table

In Supabase, open SQL Editor and run:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  occupation text,
  status text,
  monthly_income text,
  housing_cost text,
  subscriptions text,
  recurring_expenses text,
  debts text,
  upcoming_expenses text,
  savings_goals text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 3. Enable Row Level Security

Run:

```sql
alter table public.profiles enable row level security;
```

Then add policies:

```sql
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

## 4. Add Updated Timestamp Trigger

Run:

```sql
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();
```

## 5. Email Confirmation Setting

For the fastest hackathon demo, you can turn off email confirmation:

1. Supabase Dashboard
2. Authentication
3. Providers
4. Email
5. Turn off Confirm email

If email confirmation stays on, new users must verify their email before logging in.

## 6. Local Test Flow

1. Run `npm run dev`.
2. Open `http://localhost:5173/auth`.
3. Create an account with name, email, and password.
4. Fill onboarding.
5. Save and go to chat.
6. Log out and log back in.
7. Confirm the onboarding page still loads that user's saved profile.

## Notes

- Never put the Supabase service role key in frontend code.
- It is safe to use the anon/public key in the frontend when Row Level Security is enabled.
- Use fake financial data for demos. Do not test with real banking information.
