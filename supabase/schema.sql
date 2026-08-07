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
-- CUSTOMERS, ORDERS, WISHLIST — accounts that gate purchases and reviews,
-- and the record-keeping behind them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CUSTOMERS — one row per account. Populated the first time someone signs in
-- and refreshed at checkout, so it stays current even if they signed up with
-- just an email and added a phone number later.
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  signup_method text not null default '', -- 'google' | 'email' | 'phone'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

drop policy if exists "customers can read their own profile" on public.customers;
create policy "customers can read their own profile"
  on public.customers for select
  using (auth.uid() = user_id or auth.uid() in (select user_id from public.admins));

drop policy if exists "customers can write their own profile" on public.customers;
create policy "customers can write their own profile"
  on public.customers for insert
  with check (auth.uid() = user_id);

drop policy if exists "customers can update their own profile" on public.customers;
create policy "customers can update their own profile"
  on public.customers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ORDERS — a real record of every order placed, tied to the account that
-- placed it. Previously an order only ever existed as WhatsApp text; this is
-- what makes order history and "number of purchases" possible.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  subtotal integer not null default 0,
  discount integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  requirement text not null default '',
  fulfilment text not null default 'delivery',
  address text not null default '',
  city text not null default '',
  pincode text not null default '',
  payment_method text not null default '',
  paid boolean not null default false,
  payment_reference text not null default '',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "customers can read their own orders" on public.orders;
create policy "customers can read their own orders"
  on public.orders for select
  using (auth.uid() = customer_id or auth.uid() in (select user_id from public.admins));

drop policy if exists "customers can create their own orders" on public.orders;
create policy "customers can create their own orders"
  on public.orders for insert
  with check (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------
-- WISHLIST
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist enable row level security;

drop policy if exists "customers manage their own wishlist" on public.wishlist;
create policy "customers manage their own wishlist"
  on public.wishlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- APP CONFIG — small settings table. Currently just the Google Sheets sync
-- URL, kept here (not in code) so it can be changed without a redeploy.
-- ---------------------------------------------------------------------------
create table if not exists public.app_config (
  key text primary key,
  value text not null default ''
);

insert into public.app_config (key, value) values ('sheet_webhook_url', '')
  on conflict (key) do nothing;

alter table public.app_config enable row level security;
-- No policies granted — readable/writable only by triggers (definer) and the
-- SQL editor. Not exposed to anon or authenticated clients.

-- ---------------------------------------------------------------------------
-- GOOGLE SHEETS SYNC — pushes a live snapshot of each customer to the sheet
-- named IDF_CustDetails whenever their profile or an order changes. Uses
-- pg_net (Supabase's built-in async HTTP extension) to call the Apps Script
-- web app URL stored in app_config above — see
-- supabase/google-apps-script/IDF_CustDetails_sync.gs for the script itself
-- and HANDOVER.md for how to wire the URL in.
--
-- If sheet_webhook_url is still blank, these functions do nothing — silently
-- and cheaply — so leaving this unset never breaks anything else.
-- ---------------------------------------------------------------------------
create extension if not exists pg_net;

create or replace function public.sync_customer_to_sheet()
returns trigger language plpgsql security definer as $$
declare
  webhook text;
  order_count int;
begin
  select value into webhook from public.app_config where key = 'sheet_webhook_url';
  if webhook is null or webhook = '' then
    return NEW;
  end if;

  select count(*) into order_count from public.orders where customer_id = NEW.user_id;

  perform net.http_post(
    url := webhook,
    body := jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'email', NEW.email,
      'city', NEW.city,
      'signupMethod', NEW.signup_method,
      'totalOrders', order_count,
      'lastUpdated', to_char(now(), 'YYYY-MM-DD HH24:MI')
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return NEW;
end;
$$;

drop trigger if exists customers_sync_sheet on public.customers;
create trigger customers_sync_sheet
  after insert or update on public.customers
  for each row execute function public.sync_customer_to_sheet();

create or replace function public.sync_order_to_sheet()
returns trigger language plpgsql security definer as $$
declare
  webhook text;
  cust record;
  order_count int;
  items_summary text;
begin
  select value into webhook from public.app_config where key = 'sheet_webhook_url';
  if webhook is null or webhook = '' then
    return NEW;
  end if;

  select * into cust from public.customers where user_id = NEW.customer_id;
  select count(*) into order_count from public.orders where customer_id = NEW.customer_id;
  select string_agg(x->>'name', ', ') into items_summary
    from jsonb_array_elements(NEW.items) x;

  perform net.http_post(
    url := webhook,
    body := jsonb_build_object(
      'name', coalesce(cust.name, ''),
      'phone', coalesce(cust.phone, ''),
      'email', coalesce(cust.email, ''),
      'city', coalesce(cust.city, NEW.city, ''),
      'signupMethod', coalesce(cust.signup_method, ''),
      'totalOrders', order_count,
      'lastOrderCode', NEW.order_code,
      'lastOrderTotal', NEW.total,
      'lastOrderItems', coalesce(items_summary, ''),
      'lastRequirement', NEW.requirement,
      'lastUpdated', to_char(now(), 'YYYY-MM-DD HH24:MI')
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return NEW;
end;
$$;

drop trigger if exists orders_sync_sheet on public.orders;
create trigger orders_sync_sheet
  after insert on public.orders
  for each row execute function public.sync_order_to_sheet();

do $$
begin
  execute 'alter publication supabase_realtime add table public.orders';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.wishlist';
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- Done. Next: paste supabase/google-apps-script/IDF_CustDetails_sync.gs into
-- a Google Sheet named IDF_CustDetails (Extensions -> Apps Script), deploy it
-- as a web app, and run:
--   update public.app_config set value = 'PASTE_THE_DEPLOYED_URL_HERE'
--   where key = 'sheet_webhook_url';
-- ============================================================================

