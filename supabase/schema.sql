-- ============================================================================
-- IN DESIGN LUXURY FABRICS — Supabase schema
--
-- HOW TO RUN THIS: Supabase dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. Safe to re-run if something goes wrong partway; every
-- statement either uses IF NOT EXISTS or is wrapped to tolerate re-running.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PRODUCTS — the live catalog. Publicly readable; only an admin can write.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Bridal','Heritage','Contemporary')),
  composition text not null default '',
  width text not null default '44 in',
  price_per_metre integer not null check (price_per_metre > 0),
  mrp integer,
  min_metres integer not null default 1 check (min_metres > 0),
  stock text not null default 'in' check (stock in ('in','low','out')),
  tags text[] not null default '{}',
  image text not null default '',
  gallery text[] not null default '{}',
  blurb text not null default '',
  details text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products are publicly readable" on public.products;
create policy "products are publicly readable"
  on public.products for select
  using (true);

drop policy if exists "only admins can write products" on public.products;
create policy "only admins can write products"
  on public.products for all
  using (auth.uid() in (select user_id from public.admins))
  with check (auth.uid() in (select user_id from public.admins));

-- ---------------------------------------------------------------------------
-- ADMINS — links a real Supabase Auth user to admin rights. Populated
-- automatically by the admin-auth Edge Function the first time someone
-- completes the username + password + email-code login. Not writable by
-- regular clients — only the Edge Function's service-role key can insert here.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins table readable by admins only" on public.admins;
create policy "admins table readable by admins only"
  on public.admins for select
  using (auth.uid() in (select user_id from public.admins));

-- ---------------------------------------------------------------------------
-- SITE SETTINGS — a single row holding the offer banner. Publicly readable;
-- only an admin can write.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true,
  offer_active boolean not null default false,
  offer_headline text not null default '',
  offer_detail text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id) values (true)
  on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site settings are publicly readable" on public.site_settings;
create policy "site settings are publicly readable"
  on public.site_settings for select
  using (true);

drop policy if exists "only admins can write site settings" on public.site_settings;
create policy "only admins can write site settings"
  on public.site_settings for update
  using (auth.uid() in (select user_id from public.admins))
  with check (auth.uid() in (select user_id from public.admins));

-- ---------------------------------------------------------------------------
-- REVIEWS — every row is tied to a real, verified auth.users identity
-- (Google account, or email confirmed by a code). Only 'published' rows are
-- publicly visible; the admin panel is what moves a review into that state.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  -- Nullable so the admin can add a legacy/manual review (e.g. one collected
  -- before this system existed) that isn't tied to a customer account.
  -- Every review a CUSTOMER submits through the site always has this set.
  user_id uuid references auth.users(id) on delete cascade,
  user_email text not null default '',
  name text not null,
  city text not null default '',
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) >= 4),
  status text not null default 'pending' check (status in ('pending','published','private')),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "published reviews are publicly readable" on public.reviews;
create policy "published reviews are publicly readable"
  on public.reviews for select
  using (status = 'published');

drop policy if exists "customers can read their own review" on public.reviews;
create policy "customers can read their own review"
  on public.reviews for select
  using (auth.uid() = user_id);

drop policy if exists "signed-in customers can submit a review" on public.reviews;
create policy "signed-in customers can submit a review"
  on public.reviews for insert
  with check (
    -- A real customer, submitting as themselves...
    (auth.uid() = user_id and auth.email() = user_email)
    -- ...or an admin adding a review directly (e.g. migrating an old one).
    or auth.uid() in (select user_id from public.admins)
  );

drop policy if exists "admins can moderate reviews" on public.reviews;
create policy "admins can moderate reviews"
  on public.reviews for update
  using (auth.uid() in (select user_id from public.admins))
  with check (auth.uid() in (select user_id from public.admins));

drop policy if exists "admins can delete reviews" on public.reviews;
create policy "admins can delete reviews"
  on public.reviews for delete
  using (auth.uid() in (select user_id from public.admins));

-- ---------------------------------------------------------------------------
-- ADMIN LOGIN ATTEMPTS — brute-force throttling for the admin-auth function.
-- No RLS policies are granted on purpose: this table is written and read
-- only by the Edge Function's service-role key, which bypasses RLS. No
-- client using the public anon key can read or write it.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now(),
  success boolean not null,
  ip text
);

alter table public.admin_login_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- Keep updated_at accurate automatically.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.site_settings;
create trigger settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- REALTIME — lets the site subscribe to live changes instead of polling.
-- Wrapped because re-running "alter publication ... add table" on a table
-- that's already a member throws an error; this makes the script safe to
-- run more than once.
-- ---------------------------------------------------------------------------
do $$
begin
  execute 'alter publication supabase_realtime add table public.products';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.site_settings';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.reviews';
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- Done. Next: Authentication -> Providers -> make sure Email is enabled, and
-- (optional) enable Google. Then deploy the admin-auth Edge Function — see
-- supabase/functions/admin-auth/index.ts and HANDOVER.md.
-- ============================================================================
