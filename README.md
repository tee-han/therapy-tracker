# Therapy Tracker

Personal therapy tracker with focal areas, activity tracking, and notes. Syncs across devices via Supabase.

## Setup

### 1. Supabase

You can use your existing Supabase project or create a new one.

1. Go to the **SQL Editor** in your Supabase dashboard
2. Run the contents of `supabase-setup.sql` — this creates the `tracker_data` table with RLS policies

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key (found in **Settings → API** in the Supabase dashboard).

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
# From the project root
git init
git add .
git commit -m "initial commit"
```

Then either:

- **Vercel CLI**: `vercel` and follow prompts
- **Vercel Dashboard**: Import the repo from GitHub

Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in **Vercel → Project → Settings → Environment Variables**.

## How It Works

- On first visit you set a passphrase — this is hashed (SHA-256) and used as the row key in Supabase
- Use the same passphrase on any device to load the same data
- Saves are debounced (600ms) and happen automatically on blur/change
- The "Lock" button clears the passphrase from localStorage without deleting data
