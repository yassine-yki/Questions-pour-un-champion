# Supabase Account Setup

The game now treats authentication and game data as two separate layers:

- Supabase Auth stores passwords and browser sessions.
- `public.players` stores usernames, avatars, and game statistics.
- `public.game_history` stores match results.

For the current username-only UI, the browser maps `yassine` to an internal email like `yassine@qpuc.local`. In Supabase Auth settings, disable email confirmation for the demo, otherwise Supabase creates the user but will not return a login session immediately.

## Recommended `players` Table Upgrade

Run this in the Supabase SQL editor if your table does not already have `auth_user_id`:

```sql
alter table public.players
add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists players_auth_user_id_key
on public.players(auth_user_id)
where auth_user_id is not null;

create unique index if not exists players_username_key
on public.players(lower(username));
```

If your old table has a required `password_hash` column, either make it nullable or remove it after existing demo accounts are migrated:

```sql
alter table public.players alter column password_hash drop not null;
```

## Simple RLS Policies

For a school demo, this keeps profiles readable for leaderboards while limiting writes to the connected user:

```sql
alter table public.players enable row level security;

create policy "players are readable"
on public.players for select
using (true);

create policy "players can insert own profile"
on public.players for insert
with check (auth.uid() = auth_user_id);

create policy "players can update own profile"
on public.players for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
```

The JavaScript still has compatibility fallbacks for the older table shape, but the schema above is the clean architecture to present.
