# Aurum Realty — Supabase Setup

## Running the migration

1. Go to your Supabase project → SQL Editor
2. Copy the contents of `migrations/001_initial.sql`
3. Paste and run

This creates:
- 6 tables: `pipeline_stages`, `agents`, `organization`, `properties`, `leads`, `activities`
- RLS policies (authenticated users can read/write all tables)
- Trigger: auto-creates agent record on signup
- Seed data: 5 demo agents, 12 properties, 12 leads with realistic Buenos Aires data

## Environment variables needed in .env.local

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Dollar rate

The `organization` table has a `dollar_rate` column (default: 1245 ARS/USD).
The Executive Dashboard reads this to convert USD ↔ ARS.
Update it via Admin Settings → Cotización dólar.
