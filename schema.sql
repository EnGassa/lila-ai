-- Enable the pgvector extension to work with vector embeddings
create extension if not exists vector;

-- 1. Users Table
-- Stores basic user profile information.
create table if not exists public.users (
  id text not null primary key,
  full_name text,
  email text unique,
  phone text,
  is_admin boolean default false,
  onboarding_status public.onboarding_status default 'pending',
  created_at timestamptz default now()
);

-- RLS: Enable security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS: Policies
-- See bottom of file for full policy definitions or migration 001

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
create type public.analysis_status as enum ('pending', 'processing', 'completed', 'failed');

create table if not exists public.skin_analyses (
  id uuid not null primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete cascade,
  analysis_data jsonb,
  image_urls text[],
  status public.analysis_status default 'pending',
  error_message text,
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

-- 6. Products Table (Skinsort)
create table if not exists public.products_1 (
  product_slug text not null primary key,
  url text not null unique,
  name text,
  brand text,
  category text,
  description text,
  attributes text[],
  overview jsonb,
  highlights jsonb,
  meta_data jsonb,
  rating float,
  review_count integer,
  ingredient_slugs text[],
  benefits text[],
  active_ingredients text[],
  concerns text[],
  image_url text,
  embedding vector(384),
  created_at timestamptz default now(),
  disabled_at timestamptz default null
);

-- 7. Ingredients Table (Skinsort)
create table if not exists public.ingredients_1 (
  ingredient_slug text not null primary key,
  url text not null unique,
  name text,
  description text,
  tags jsonb,
  what_it_does jsonb,
  prevalence jsonb,
  cosing_data jsonb,
  "references" text[],
  user_sentiment jsonb,
  embedding vector(384),
  created_at timestamptz default now()
);

-- 8. Intake Submissions Table
-- Stores user answers from the onboarding questionnaire
create table if not exists public.intake_submissions (
  id uuid not null primary key default gen_random_uuid(),
  user_id text unique references public.users(id) on delete cascade,
  age integer,
  gender text,
  city text,
  skin_conditions text[],
  sleep_hours text,
  stress_level integer,
  hormonal_status jsonb,
  medication text,
  allergies text,
  pregnancy_status text,
  makeup_frequency text,
  smoking text,
  daily_routine_frequency text,
  current_routine jsonb,
  budget text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Feedback Submissions Table
-- Stores user feedback on recommendations
create table if not exists public.feedback_submissions (
  id uuid not null primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete cascade,
  helpfulness_score integer,
  accuracy_score integer,
  qualitative_feedback text,
  clarity_score integer,
  explanation_quality text,
  trust_score integer,
  personalization_suggestions text,
  ux_score integer,
  frustration_points text,
  improvement_suggestions text,
  procurement_preference text,
  subscription_interest text,
  subscription_features text[],
  willingness_to_pay_sub text,
  willingness_to_pay_one_time text,
  derm_consult_interest text,
  interview_willingness boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RPC Functions for Vector Search

create or replace function match_ingredients(
  query_embedding vector(384),
  match_count int
)
returns table (
  ingredient_slug text,
  url text,
  name text,
  what_it_does jsonb,
  similarity float
)
language sql stable
as $$
  select
    i.ingredient_slug,
    i.url,
    i.name,
    i.what_it_does,
    1 - (i.embedding <=> query_embedding) as similarity
  from ingredients_1 as i
  where i.embedding is not null
  order by similarity desc
  limit match_count;
$$;

create or replace function get_distinct_categories()
returns table (
  category text
)
language sql stable
as $$
  select distinct category from products_1 where category is not null and disabled_at is null order by category;
$$;

create or replace function match_products_by_category(
  query_embedding vector(384),
  p_category text,
  match_count int,
  p_active_ingredients text[] default null
)
returns table (
  product_slug text,
  url text,
  name text,
  brand text,
  category text,
  overview jsonb,
  meta_data jsonb,
  ingredient_slugs text[],
  benefits text[],
  active_ingredients text[],
  concerns text[],
  similarity float
)
language sql stable
as $$
  select
    p.product_slug,
    p.url,
    p.name,
    p.brand,
    p.category,
    p.overview,
    p.meta_data,
    p.ingredient_slugs,
    p.benefits,
    p.active_ingredients,
    p.concerns,
    1 - (p.embedding <=> query_embedding) as similarity
  from products_1 as p
  where
    p.embedding is not null
    and p.category = p_category
    and p.disabled_at is null
    and (
      p_active_ingredients is null
      or array_length(p_active_ingredients, 1) is null
      or p.active_ingredients && p_active_ingredients
    )
  order by similarity desc
  limit match_count;
$$;

-- Phase 1 Updates (Self-Service Foundation)

-- 10. Enums
CREATE TYPE public.onboarding_status AS ENUM ('pending', 'intake_completed', 'photos_uploaded', 'analyzing', 'complete');

-- 11. Security Helper Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, onboarding_status)
  VALUES (
    new.id::text, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()::text
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view own analyses" ON public.skin_analyses FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Users can insert own analyses" ON public.skin_analyses FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own intake" ON public.intake_submissions FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Users can insert own intake" ON public.intake_submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own intake" ON public.intake_submissions FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own recommendations" ON public.recommendations FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Users can view own feedback" ON public.feedback_submissions FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Users can insert own feedback" ON public.feedback_submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 14. Retailers Table (Affiliate / Supply Chain)
create table if not exists public.retailers (
  id uuid not null primary key default gen_random_uuid(),
  name text not null unique,
  base_url text,
  logo_url text,
  country_code text default 'Global',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.retailers enable row level security;
create policy "Admins can manage retailers" on public.retailers for all using (public.is_admin());
create policy "Everyone can view active retailers" on public.retailers for select using (is_active = true OR public.is_admin());

-- 15. Product Purchase Options (Affiliate Links)
create table if not exists public.product_purchase_options (
  id uuid not null primary key default gen_random_uuid(),
  product_slug text references public.products_1(product_slug) on delete cascade,
  retailer_id uuid references public.retailers(id) on delete cascade,
  url text not null,
  price numeric,
  currency text default 'USD',
  is_affiliate boolean default true,
  priority integer default 0, -- Higher number = Higher priority
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.product_purchase_options enable row level security;
create policy "Admins can manage purchase options" on public.product_purchase_options for all using (public.is_admin());
create policy "Everyone can view active purchase options" on public.product_purchase_options for select using (is_active = true OR public.is_admin());
