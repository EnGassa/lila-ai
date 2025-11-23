-- Enable the pgvector extension to work with vector embeddings
create extension if not exists vector;

-- 1. Users Table
-- Stores basic user profile information.
create table if not exists public.users (
  id text not null primary key,
  full_name text,
  email text unique,
  created_at timestamptz default now()
);

-- 2. Products Table
-- Stores skincare product information, including embeddings for search.
create table if not exists public.products (
  id text not null primary key,
  name text,
  brand text,
  category text,
  ingredients text[],
  actives jsonb,
  claims jsonb,
  links jsonb,
  metadata jsonb,
  purpose text[],
  embedding vector(384) -- Using 384 as it's a common dimension for sentence-transformers
);

-- 3. Skin Analyses Table
-- Stores the JSON output from the AI skin analysis.
create table if not exists public.skin_analyses (
  id uuid not null primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete cascade,
  analysis_data jsonb,
  created_at timestamptz default now()
);

-- 4. Recommendations Table
-- Stores product recommendations for each skin analysis (1:1 relationship).
create table if not exists public.recommendations (
  id uuid not null primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete cascade,
  skin_analysis_id uuid references public.skin_analyses(id) on delete cascade,
  recommendations_data jsonb,
  created_at timestamptz default now()
);

-- 5. Ingredients Table
-- Stores detailed information about skincare ingredients, scraped from incidecoder.com.
create table if not exists public.ingredients (
  id uuid not null primary key default gen_random_uuid(),
  name text not null unique,
  what_it_does text[],
  description text,
  cosing_info jsonb,
  source_url text not null unique,
  our_take text,
  quick_facts text[],
  image_url text,
  embedding vector(384),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
