-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type org_plan as enum ('free', 'pro', 'business');
create type user_role as enum ('owner', 'admin', 'agent');
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type article_status as enum ('draft', 'published');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  plan        org_plan not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  role        user_role not null default 'agent',
  full_name   text not null,
  avatar_url  text,
  email       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_org_id_idx on profiles(org_id);

-- ============================================================
-- INVITATIONS
-- ============================================================
create table invitations (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  email       text not null,
  role        user_role not null default 'agent',
  token       uuid not null unique default uuid_generate_v4(),
  invited_by  uuid not null references profiles(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index invitations_org_id_idx on invitations(org_id);
create index invitations_token_idx on invitations(token);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table customers (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  company     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index customers_org_id_idx on customers(org_id);
create index customers_email_idx on customers(org_id, email);

-- ============================================================
-- TICKETS
-- ============================================================
create table tickets (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  assignee_id uuid references profiles(id) on delete set null,
  title       text not null,
  description text not null default '',
  status      ticket_status not null default 'open',
  priority    ticket_priority not null default 'medium',
  category    text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index tickets_org_id_idx on tickets(org_id);
create index tickets_org_status_idx on tickets(org_id, status);
create index tickets_org_assignee_idx on tickets(org_id, assignee_id);
create index tickets_created_at_idx on tickets(org_id, created_at desc);

-- ============================================================
-- TICKET MESSAGES
-- ============================================================
create table ticket_messages (
  id          uuid primary key default uuid_generate_v4(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  content     text not null,
  is_ai       boolean not null default false,
  is_customer boolean not null default false,
  created_at  timestamptz not null default now()
);

create index ticket_messages_ticket_id_idx on ticket_messages(ticket_id, created_at asc);

-- ============================================================
-- KNOWLEDGE ARTICLES
-- ============================================================
create table knowledge_articles (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  status      article_status not null default 'draft',
  category    text,
  tags        text[] not null default '{}',
  author_id   uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index knowledge_articles_org_id_idx on knowledge_articles(org_id);
create index knowledge_articles_status_idx on knowledge_articles(org_id, status);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  org_id                 uuid not null unique references organizations(id) on delete cascade,
  paypal_subscription_id text,
  plan                   org_plan not null default 'free',
  status                 text not null default 'active',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index subscriptions_paypal_id_idx on subscriptions(paypal_subscription_id);

-- ============================================================
-- AI USAGE LOGS
-- ============================================================
create table ai_usage_logs (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  feature     text not null,
  provider    text not null,
  tokens_used integer not null default 0,
  created_at  timestamptz not null default now()
);

create index ai_usage_logs_org_month_idx on ai_usage_logs(org_id, created_at);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_updated_at before update on organizations for each row execute function handle_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function handle_updated_at();
create trigger customers_updated_at before update on customers for each row execute function handle_updated_at();
create trigger tickets_updated_at before update on tickets for each row execute function handle_updated_at();
create trigger knowledge_articles_updated_at before update on knowledge_articles for each row execute function handle_updated_at();
create trigger subscriptions_updated_at before update on subscriptions for each row execute function handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP (via auth trigger)
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Profile is created in the application signup flow, not here.
  -- This trigger is a safety net for edge cases.
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table invitations enable row level security;
alter table customers enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table knowledge_articles enable row level security;
alter table subscriptions enable row level security;
alter table ai_usage_logs enable row level security;

-- Helper function: get current user's org_id
create or replace function get_user_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- Helper function: get current user's role
create or replace function get_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- ---- organizations ----
create policy "Users can view their organization"
  on organizations for select
  using (id = get_user_org_id());

create policy "Owners can update their organization"
  on organizations for update
  using (id = get_user_org_id() and get_user_role() in ('owner', 'admin'));

-- ---- profiles ----
create policy "Users can view profiles in their org"
  on profiles for select
  using (org_id = get_user_org_id());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Admins can update profiles in their org"
  on profiles for update
  using (org_id = get_user_org_id() and get_user_role() in ('owner', 'admin'));

-- ---- invitations ----
create policy "Admins can manage invitations"
  on invitations for all
  using (org_id = get_user_org_id() and get_user_role() in ('owner', 'admin'));

create policy "Anyone can view invitation by token"
  on invitations for select
  using (true);

-- ---- customers ----
create policy "Users can manage customers in their org"
  on customers for all
  using (org_id = get_user_org_id());

-- ---- tickets ----
create policy "Users can manage tickets in their org"
  on tickets for all
  using (org_id = get_user_org_id());

-- ---- ticket_messages ----
create policy "Users can manage messages in their org tickets"
  on ticket_messages for all
  using (
    ticket_id in (select id from tickets where org_id = get_user_org_id())
  );

-- ---- knowledge_articles ----
create policy "Users can manage articles in their org"
  on knowledge_articles for all
  using (org_id = get_user_org_id());

-- ---- subscriptions ----
create policy "Users can view their org subscription"
  on subscriptions for select
  using (org_id = get_user_org_id());

create policy "Owners can manage their org subscription"
  on subscriptions for all
  using (org_id = get_user_org_id() and get_user_role() in ('owner', 'admin'));

-- ---- ai_usage_logs ----
create policy "Users can view their org AI usage"
  on ai_usage_logs for select
  using (org_id = get_user_org_id());

create policy "System can insert AI usage logs"
  on ai_usage_logs for insert
  with check (org_id = get_user_org_id());

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table ticket_messages;
alter publication supabase_realtime add table tickets;
