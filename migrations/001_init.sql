create table if not exists members (
  id serial primary key,
  roblox_username text not null,
  username_key text not null unique,
  status text not null check (status in ('active', 'discharged')),
  rank text,
  position text,
  subdivision text,
  level text,
  timezone text,
  hire_date date,
  discharge_type text check (
    discharge_type is null
    or discharge_type in ('honorable', 'dishonorable', 'unknown')
  ),
  discharge_provisional boolean not null default false,
  strikes_note text,
  loa boolean,
  source_sheet text,
  updated_at timestamptz not null default now()
);

create index if not exists members_status_idx on members (status);
create index if not exists members_subdivision_idx on members (subdivision);
create index if not exists members_rank_idx on members (rank);

create table if not exists admin_logs (
  id serial primary key,
  username text not null,
  username_key text not null,
  subdivision text,
  action text not null,
  description text,
  officer_name text,
  effective_date date,
  source_workbook text not null,
  source_row integer,
  unique (
    username_key,
    action,
    description,
    officer_name,
    effective_date,
    source_workbook
  )
);

create index if not exists admin_logs_username_idx on admin_logs (username_key);
create index if not exists admin_logs_action_idx on admin_logs (action);
create index if not exists admin_logs_subdivision_idx on admin_logs (subdivision);
create index if not exists admin_logs_date_idx on admin_logs (effective_date desc nulls last);

create table if not exists awards (
  id serial primary key,
  name text not null unique,
  category text not null check (category in ('high_honor', 'medal', 'ribbon')),
  sort_order integer not null default 0
);

create table if not exists award_grants (
  id serial primary key,
  award_id integer not null references awards (id),
  username text not null,
  username_key text not null,
  grant_count integer not null default 1,
  unique (award_id, username_key)
);

create index if not exists award_grants_username_idx on award_grants (username_key);

create table if not exists hall_of_fame_entries (
  id serial primary key,
  username text not null,
  username_key text not null,
  title text,
  blurb text,
  sort_order integer not null default 0
);

create table if not exists past_chiefs (
  id serial primary key,
  username text not null,
  username_key text not null,
  started_on date,
  ended_on date,
  notes text,
  sort_order integer not null default 0,
  needs_confirmation boolean not null default true
);

create table if not exists import_runs (
  id serial primary key,
  workbook text not null,
  sheet text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  row_counts jsonb,
  notes text
);

create table if not exists avatar_cache (
  username_key text primary key,
  roblox_user_id bigint,
  image_url text,
  fetched_at timestamptz not null default now()
);
