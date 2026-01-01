-- Phase 1: Foundation (Database & Security)
-- Status: APPLIED

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.onboarding_status AS ENUM ('pending', 'intake_completed', 'photos_uploaded', 'analyzing', 'complete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_status public.onboarding_status DEFAULT 'pending';

-- 2. Security Helper Functions (Fixed casting)
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

-- 3. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Policies (Fixed casting)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid()::text = id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can view own analyses" ON public.skin_analyses;
CREATE POLICY "Users can view own analyses" ON public.skin_analyses FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.skin_analyses;
CREATE POLICY "Users can insert own analyses" ON public.skin_analyses FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own intake" ON public.intake_submissions;
CREATE POLICY "Users can view own intake" ON public.intake_submissions FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can insert own intake" ON public.intake_submissions;
CREATE POLICY "Users can insert own intake" ON public.intake_submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can update own intake" ON public.intake_submissions;
CREATE POLICY "Users can update own intake" ON public.intake_submissions FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.recommendations;
CREATE POLICY "Users can view own recommendations" ON public.recommendations FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback_submissions;
CREATE POLICY "Users can view own feedback" ON public.feedback_submissions FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback_submissions;
CREATE POLICY "Users can insert own feedback" ON public.feedback_submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
