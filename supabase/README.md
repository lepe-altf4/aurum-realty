# Aurum Realty — Supabase Setup

## Running the migrations

Open Supabase → **SQL Editor** → New query. Run these in order:

### 1. `migrations/001_initial.sql`
Creates schema, triggers, RLS policies, and initial seed.
**Now fully idempotent** — safe to re-run; uses `drop policy if exists` and exception handlers for realtime.

### 2. `migrations/002_reseed.sql`
**Run this if leads or properties aren't showing up.**
- Re-creates all RLS policies (drop + create)
- Re-inserts the 12 demo properties, 5 demo agents, 12 demo leads — only if missing
- Ends with a verification query — you should see:
  ```
  orgs=1, stages=5, agents=5+, properties=12, leads=12, activities=5
  ```

Both files are safe to run multiple times.

## Troubleshooting "no data appearing"

If you logged in successfully but `/leads` and `/properties` are empty:

1. **Check seed actually inserted.** In Supabase → SQL Editor:
   ```sql
   select count(*) from leads;
   select count(*) from properties;
   ```
   If either is 0, run `002_reseed.sql`.

2. **Check RLS isn't blocking.** Same editor, run as the *authenticated user* (use Supabase's "Run as user" or just open the table editor — if you can see rows there, RLS is fine for service role; the app uses anon key + user JWT).
   - All policies require `auth.role() = 'authenticated'`. If your app session is valid, the JWT will satisfy this.
   - If you accidentally lost the policies during a partial migration, `002_reseed.sql` re-creates them.

3. **Check env vars on Vercel.** Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   Redeploy after adding/changing them.

## Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Dollar rate

The `organization` table has a `dollar_rate` column (default: 1245 ARS/USD).
The Executive Dashboard reads this to convert USD ↔ ARS.
Update it via **Admin Settings → Cotización dólar**.

## Admin user

The user `lepemate1310@gmail.com` is auto-assigned the `Admin` role on signup
(via `handle_new_agent()` trigger). All other signups default to `Agente`.
