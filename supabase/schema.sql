create extension if not exists "pgcrypto";

create table if not exists marketplace_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id text primary key,
  name text not null,
  account text,
  phone text,
  email text not null,
  role text not null check (role in ('buyer', 'creator', 'admin')),
  status text not null default 'active',
  suspended_reason text,
  created_at date not null default current_date
);

create table if not exists buyer_profiles (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  company_name text not null,
  display_name text,
  avatar_url text,
  profile_slogan text,
  industry text,
  location text,
  company_intro text,
  verification_type text,
  contact_email text,
  contact_phone text,
  website_url text,
  social_url text,
  service_area text,
  business_license_file text,
  qualification_files jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  rejected_reason text,
  review_draft jsonb,
  review_draft_submitted_at timestamptz,
  review_draft_rejected_reason text,
  cover text
);

create table if not exists creator_profiles (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  name text not null,
  title text,
  location text,
  bio text,
  resume text,
  skills jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  portfolio jsonb not null default '[]'::jsonb,
  portfolio_items jsonb not null default '[]'::jsonb,
  service_packages jsonb not null default '[]'::jsonb,
  price_min integer not null default 0,
  price_max integer not null default 0,
  completed_projects integer not null default 0,
  rating numeric not null default 4.6,
  response_time text,
  verified boolean not null default false,
  rejected_reason text,
  review_draft jsonb,
  review_draft_submitted_at timestamptz,
  review_draft_rejected_reason text,
  identity_type text,
  verification_type text,
  credential_file text,
  qualification_files jsonb not null default '[]'::jsonb,
  avatar_url text,
  display_name text,
  profile_slogan text,
  website_url text,
  social_url text,
  service_area text,
  contact_email text,
  contact_phone text,
  training_profile jsonb,
  cover text
);

create table if not exists projects (
  id text primary key,
  buyer_id text not null references app_users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  tags jsonb not null default '[]'::jsonb,
  use_case text,
  deliverable_types jsonb not null default '[]'::jsonb,
  urgency text,
  need_invoice boolean,
  long_term boolean,
  accept_platform_recommend boolean,
  training_requirement jsonb,
  budget integer not null default 0,
  deadline date not null,
  status text not null default 'open',
  reference_file text,
  qualification_file text,
  contact_email text,
  contact_phone text,
  agent_brief jsonb,
  rejected_reason text,
  created_at date not null default current_date
);

create table if not exists project_matches (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  creator_id text not null references creator_profiles(id) on delete cascade,
  score integer not null default 0,
  reason text not null,
  risk text,
  next_step text
);

create table if not exists orders (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  buyer_id text not null references app_users(id) on delete cascade,
  creator_id text not null references creator_profiles(id) on delete cascade,
  amount integer not null default 0,
  status text not null default 'active',
  result_reason text,
  result_note text,
  result_updated_at timestamptz,
  deliverable_url text,
  created_at date not null default current_date
);

create table if not exists messages (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  sender_id text not null,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  buyer_id text not null references app_users(id) on delete cascade,
  creator_id text not null references creator_profiles(id) on delete cascade,
  rating integer not null,
  comment text,
  created_at date not null default current_date
);

create table if not exists abuse_reports (
  id text primary key,
  reporter_id text not null references app_users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open',
  resolution text,
  created_at timestamptz not null default now()
);

create table if not exists trial_feedback (
  id text primary key,
  user_id text references app_users(id) on delete set null,
  role text,
  page text not null,
  rating integer,
  category text not null default 'suggestion',
  content text not null,
  status text not null default 'open',
  resolution text,
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  role text not null,
  event_type text not null,
  target_type text,
  target_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists projects_status_idx on projects(status);
create index if not exists projects_category_idx on projects(category);
create index if not exists project_matches_project_id_idx on project_matches(project_id);
create index if not exists orders_buyer_id_idx on orders(buyer_id);
create index if not exists orders_creator_id_idx on orders(creator_id);
create index if not exists messages_order_id_idx on messages(order_id);
create index if not exists abuse_reports_status_idx on abuse_reports(status);
create index if not exists abuse_reports_target_idx on abuse_reports(target_type, target_id);
create index if not exists trial_feedback_status_idx on trial_feedback(status);
create index if not exists trial_feedback_created_at_idx on trial_feedback(created_at);
create index if not exists activity_events_created_at_idx on activity_events(created_at);

alter table app_users add column if not exists account text;
alter table app_users add column if not exists phone text;
alter table app_users add column if not exists status text not null default 'active';
alter table app_users add column if not exists suspended_reason text;
alter table buyer_profiles add column if not exists rejected_reason text;
alter table buyer_profiles add column if not exists review_draft jsonb;
alter table buyer_profiles add column if not exists review_draft_submitted_at timestamptz;
alter table buyer_profiles add column if not exists review_draft_rejected_reason text;
alter table creator_profiles add column if not exists rejected_reason text;
alter table creator_profiles add column if not exists review_draft jsonb;
alter table creator_profiles add column if not exists review_draft_submitted_at timestamptz;
alter table creator_profiles add column if not exists review_draft_rejected_reason text;
alter table creator_profiles add column if not exists portfolio_items jsonb not null default '[]'::jsonb;
alter table creator_profiles add column if not exists service_packages jsonb not null default '[]'::jsonb;
alter table creator_profiles add column if not exists training_profile jsonb;
alter table projects add column if not exists rejected_reason text;
alter table projects add column if not exists tags jsonb not null default '[]'::jsonb;
alter table projects add column if not exists use_case text;
alter table projects add column if not exists deliverable_types jsonb not null default '[]'::jsonb;
alter table projects add column if not exists urgency text;
alter table projects add column if not exists need_invoice boolean;
alter table projects add column if not exists long_term boolean;
alter table projects add column if not exists accept_platform_recommend boolean;
alter table projects add column if not exists training_requirement jsonb;
alter table orders add column if not exists result_reason text;
alter table orders add column if not exists result_note text;
alter table orders add column if not exists result_updated_at timestamptz;
alter table activity_events add column if not exists note text;

alter table app_users enable row level security;
alter table buyer_profiles enable row level security;
alter table creator_profiles enable row level security;
alter table projects enable row level security;
alter table project_matches enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table abuse_reports enable row level security;
alter table trial_feedback enable row level security;
alter table activity_events enable row level security;

-- 业务表默认不开放给浏览器 anon key 直接访问。
-- 当前应用统一通过 Next.js API + service role 在服务端做鉴权和写入。
-- 如果未来改成客户端直接访问 Supabase，再按表补精细化 RLS policy。

-- Production auth/storage notes:
-- 1. 用户登录和密码由 Supabase Auth 管理，业务表通过 auth.users.id 关联真实用户。
-- 2. 头像、Logo、公开作品图放入 public-assets bucket。
-- 3. 营业执照、组织证明、授权材料等放入 private-verifications bucket。

insert into storage.buckets (id, name, public)
values
  ('public-assets', 'public-assets', true),
  ('private-verifications', 'private-verifications', false)
on conflict (id) do nothing;

drop policy if exists "公开素材可读取" on storage.objects;
create policy "公开素材可读取"
on storage.objects for select
using (bucket_id = 'public-assets');

drop policy if exists "登录用户上传公开素材" on storage.objects;
create policy "登录用户上传公开素材"
on storage.objects for insert
with check (bucket_id = 'public-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "用户读取自己的资质材料" on storage.objects;
create policy "用户读取自己的资质材料"
on storage.objects for select
using (bucket_id = 'private-verifications' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "用户上传自己的资质材料" on storage.objects;
create policy "用户上传自己的资质材料"
on storage.objects for insert
with check (bucket_id = 'private-verifications' and auth.uid()::text = (storage.foldername(name))[1]);
