create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer', 'creator', 'admin');
create type public.project_category as enum ('AI Short Video', 'Image Design', 'Digital Human');
create type public.project_status as enum ('open', 'matching', 'in_progress', 'completed');
create type public.order_status as enum ('active', 'delivered', 'revision', 'approved');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'buyer',
  created_at timestamptz not null default now()
);

create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  title text not null,
  location text not null default '',
  bio text not null default '',
  skills text[] not null default '{}',
  categories public.project_category[] not null default '{}',
  portfolio text[] not null default '{}',
  price_min integer not null check (price_min >= 0),
  price_max integer not null check (price_max >= price_min),
  completed_projects integer not null default 0 check (completed_projects >= 0),
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  response_time text not null default '',
  verified boolean not null default false,
  cover text not null default '',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  category public.project_category not null,
  budget integer not null check (budget >= 0),
  deadline date not null,
  status public.project_status not null default 'open',
  reference_file text,
  created_at timestamptz not null default now()
);

create table public.project_matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, creator_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  amount integer not null check (amount >= 0),
  status public.order_status not null default 'active',
  deliverable_url text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.user_role not null,
  event_type text not null check (event_type in ('login', 'browse', 'post_project', 'invite_creator', 'send_message', 'deliver_order', 'approve_order')),
  target_type text check (target_type in ('creator', 'project', 'order')),
  target_id uuid,
  created_at timestamptz not null default now()
);

create index creator_profiles_categories_idx on public.creator_profiles using gin (categories);
create index creator_profiles_skills_idx on public.creator_profiles using gin (skills);
create index projects_buyer_id_idx on public.projects (buyer_id);
create index projects_status_idx on public.projects (status);
create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_creator_id_idx on public.orders (creator_id);
create index messages_order_id_idx on public.messages (order_id, created_at);
create index activity_events_user_id_idx on public.activity_events (user_id, created_at);
create index activity_events_role_idx on public.activity_events (role, created_at);

alter table public.users enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_matches enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_events enable row level security;

create policy "Users can read marketplace users"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = auth_user_id);

create policy "Creators are publicly readable"
  on public.creator_profiles for select
  using (true);

create policy "Creators can manage own profile"
  on public.creator_profiles for all
  using (exists (
    select 1 from public.users
    where users.id = creator_profiles.user_id and users.auth_user_id = auth.uid()
  ));

create policy "Projects are publicly readable"
  on public.projects for select
  using (true);

create policy "Buyers can manage own projects"
  on public.projects for all
  using (exists (
    select 1 from public.users
    where users.id = projects.buyer_id and users.auth_user_id = auth.uid()
  ));

create policy "Project matches are readable"
  on public.project_matches for select
  using (true);

create policy "Orders readable by participants"
  on public.orders for select
  using (
    exists (
      select 1 from public.users
      where users.id = orders.buyer_id and users.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.creator_profiles
      join public.users on users.id = creator_profiles.user_id
      where creator_profiles.id = orders.creator_id and users.auth_user_id = auth.uid()
    )
  );

create policy "Buyers can create orders"
  on public.orders for insert
  with check (exists (
    select 1 from public.users
    where users.id = orders.buyer_id and users.auth_user_id = auth.uid()
  ));

create policy "Messages readable by order participants"
  on public.messages for select
  using (exists (
    select 1 from public.orders
    where orders.id = messages.order_id
    and (
      exists (
        select 1 from public.users
        where users.id = orders.buyer_id and users.auth_user_id = auth.uid()
      )
      or exists (
        select 1 from public.creator_profiles
        join public.users on users.id = creator_profiles.user_id
        where creator_profiles.id = orders.creator_id and users.auth_user_id = auth.uid()
      )
    )
  ));

create policy "Participants can send messages"
  on public.messages for insert
  with check (exists (
    select 1 from public.orders
    where orders.id = messages.order_id
    and (
      exists (
        select 1 from public.users
        where users.id = orders.buyer_id and users.auth_user_id = auth.uid()
      )
      or exists (
        select 1 from public.creator_profiles
        join public.users on users.id = creator_profiles.user_id
        where creator_profiles.id = orders.creator_id and users.auth_user_id = auth.uid()
      )
    )
  ));

create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "Users can write own activity events"
  on public.activity_events for insert
  with check (exists (
    select 1 from public.users
    where users.id = activity_events.user_id and users.auth_user_id = auth.uid()
  ));

create policy "Users can read own activity events"
  on public.activity_events for select
  using (exists (
    select 1 from public.users
    where users.id = activity_events.user_id and users.auth_user_id = auth.uid()
  ));
