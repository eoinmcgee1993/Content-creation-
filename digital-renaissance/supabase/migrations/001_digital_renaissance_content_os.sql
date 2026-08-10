-- Digital Renaissance Content OS
-- Apply to a dedicated Supabase project/database.

create extension if not exists pgcrypto;

do $$ begin
  create type content_status as enum ('idea','draft','review','approved','queued','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_format as enum ('article','short','social','quote','script','newsletter');
exception when duplicate_object then null; end $$;

create table if not exists editorial_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text unique,
  body_markdown text not null,
  category_id uuid references editorial_categories(id),
  status content_status not null default 'draft',
  format content_format not null default 'article',
  word_count integer,
  source_notes text,
  evidence_level text,
  provocative_score integer check (provocative_score between 1 and 10),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_derivatives (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  format content_format not null,
  platform text not null,
  body text not null,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists distribution_queue (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content_derivatives(id) on delete cascade,
  platform text not null,
  scheduled_for timestamptz,
  status content_status not null default 'queued',
  external_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_idx on articles(status);
create index if not exists articles_category_idx on articles(category_id);
create index if not exists distribution_queue_schedule_idx on distribution_queue(status, scheduled_for);

insert into editorial_categories (slug, name, description) values
('machine','The Machine','AI, automation, algorithms, surveillance and digital dependence.'),
('grind','The Grind','Work, careers, hustle culture, productivity, entrepreneurship and money.'),
('mind','The Mind','Psychology, attention, identity, consciousness and self-improvement.'),
('body','The Body','Biohacking, longevity, fitness, nutrition, performance and human optimisation.'),
('market','The Market','Capitalism, consumerism, wealth, status and economic incentives.'),
('human','The Human','Relationships, loneliness, masculinity, sex, ageing, death and meaning.'),
('taboo','The Taboo','Uncomfortable questions, hypocrisy, power, censorship and forbidden ideas.'),
('underground','The Underground','Subcultures, fringe communities, forgotten movements and counterculture.'),
('state','The State','Institutions, bureaucracy, education, healthcare, regulation and power.'),
('renaissance','The Renaissance','Philosophy, sovereignty, independence, creation and alternative systems.'),
('off-the-map','Off the Map','Strange subjects that don''t need to fit anywhere else.')
on conflict (slug) do nothing;

alter table editorial_categories enable row level security;
alter table articles enable row level security;
alter table content_derivatives enable row level security;
alter table distribution_queue enable row level security;

-- Keep the schema private until the application access model is defined.
-- Do not expose these tables through the public Data API without deliberate RLS policies.
