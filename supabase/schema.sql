create extension if not exists "pgcrypto";

create table if not exists marketplace_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id text primary key,
  name text not null,
  email text not null,
  role text not null check (role in ('buyer', 'creator', 'admin')),
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
  price_min integer not null default 0,
  price_max integer not null default 0,
  completed_projects integer not null default 0,
  rating numeric not null default 4.6,
  response_time text,
  verified boolean not null default false,
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
  cover text
);

create table if not exists projects (
  id text primary key,
  buyer_id text not null references app_users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  budget integer not null default 0,
  deadline date not null,
  status text not null default 'open',
  reference_file text,
  qualification_file text,
  contact_email text,
  contact_phone text,
  agent_brief jsonb,
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

create table if not exists activity_events (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  role text not null,
  event_type text not null,
  target_type text,
  target_id text,
  created_at timestamptz not null default now()
);

create index if not exists projects_status_idx on projects(status);
create index if not exists projects_category_idx on projects(category);
create index if not exists project_matches_project_id_idx on project_matches(project_id);
create index if not exists orders_buyer_id_idx on orders(buyer_id);
create index if not exists orders_creator_id_idx on orders(creator_id);
create index if not exists messages_order_id_idx on messages(order_id);
create index if not exists activity_events_created_at_idx on activity_events(created_at);
