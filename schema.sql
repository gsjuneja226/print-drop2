-- PrintDrop Database Schema
create extension if not exists "uuid-ossp";

-- Drop existing tables to ensure clean recreation of updated schema
drop table if exists print_jobs cascade;
drop table if exists kiosks cascade;
drop table if exists pricing cascade;
drop table if exists admin_sessions cascade;

-- Kiosks
create table kiosks (
  id            text primary key,
  location_name text not null,
  location_addr text,
  is_active     boolean default true,
  is_online     boolean default false,
  last_ping     timestamptz,
  created_at    timestamptz default now()
);
insert into kiosks (id, location_name, location_addr, is_active) values ('KIOSK_001', 'Main Library Kiosk', 'Ground Floor, Central Library', true) on conflict (id) do nothing;
insert into kiosks (id, location_name, location_addr, is_active) values ('KIOSK_002', 'Hostel C Lounge', 'First Floor Reception, Hostel C', true) on conflict (id) do nothing;

-- Pricing config (single row)
create table pricing (
  id            integer primary key default 1,
  bw_per_page   integer default 2,
  color_per_page integer default 8,
  updated_at    timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into pricing (id) values (1) on conflict (id) do nothing;

-- Print jobs
create table print_jobs (
  id               uuid primary key default uuid_generate_v4(),
  kiosk_id         text references kiosks(id),
  file_url         text not null,
  file_name        text not null,
  file_type        text not null,
  page_count       integer not null,
  status           text default 'pending_payment'
    check (status in ('pending_payment','paid','printing','completed','failed','expired')),
  otp              text,
  otp_expires_at   timestamptz,
  otp_attempts     integer default 0,
  payment_id       text,
  razorpay_order_id text,
  amount           integer not null,
  bw_price_used    integer,
  color_price_used integer,
  color_mode       text default 'bw'    check (color_mode in ('bw','color')),
  sides            text default 'single' check (sides in ('single','double')),
  copies           integer default 1,
  orientation      text default 'portrait' check (orientation in ('portrait','landscape')),
  paper_size       text default 'A4'    check (paper_size in ('A4','A3','Letter')),
  page_range       text default 'all',
  selected_pages   integer,
  physical_sheets  integer,
  created_at       timestamptz default now(),
  paid_at          timestamptz,
  printing_at      timestamptz,
  completed_at     timestamptz,
  file_deleted_at  timestamptz
);

create index if not exists print_jobs_kiosk_id_idx on print_jobs(kiosk_id);
create index if not exists print_jobs_status_idx on print_jobs(status);
create index if not exists print_jobs_otp_idx on print_jobs(otp);
create index if not exists print_jobs_created_at_idx on print_jobs(created_at);
create index if not exists print_jobs_paid_at_idx on print_jobs(paid_at);

-- Admin sessions (simple)
create table admin_sessions (
  token      text primary key,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

-- RLS
alter table kiosks      enable row level security;
alter table print_jobs  enable row level security;
alter table pricing     enable row level security;

-- Service role bypass policies (enabling full CRUD access for convenience and admin/kiosk flow logic)
drop policy if exists "service_all_kiosks" on kiosks;
create policy "service_all_kiosks" on kiosks using (true) with check (true);

drop policy if exists "service_all_jobs" on print_jobs;
create policy "service_all_jobs" on print_jobs using (true) with check (true);

drop policy if exists "service_all_pricing" on pricing;
create policy "service_all_pricing" on pricing using (true) with check (true);
