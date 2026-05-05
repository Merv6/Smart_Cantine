-- 1. TABLES
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  commune TEXT,
  arrondissement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IS NULL OR role IN ('SUPER_ADMIN', 'DIRECTOR', 'COOK')),
  phone TEXT,
  department TEXT,
  commune TEXT,
  arrondissement TEXT,
  school TEXT,
  cip_number TEXT,
  school_id UUID REFERENCES public.schools(id),
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrations pour la table profiles
DO $$ 
BEGIN 
  -- Ajouter school_id si manquant
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='school_id') THEN
    ALTER TABLE public.profiles ADD COLUMN school_id UUID REFERENCES public.schools(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  
  -- Assouplir la contrainte de rôle
  IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IS NULL OR role IN ('SUPER_ADMIN', 'DIRECTOR', 'COOK'));
END $$;

-- Migration pour la table schools
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='department') THEN
    ALTER TABLE public.schools ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='commune') THEN
    ALTER TABLE public.schools ADD COLUMN commune TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='arrondissement') THEN
    ALTER TABLE public.schools ADD COLUMN arrondissement TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='director_name') THEN
    ALTER TABLE public.schools ADD COLUMN director_name TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.validation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  role_requested TEXT,
  school_name TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration pour ajouter document_url si la table existe déjà
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='validation_requests' AND column_name='document_url') THEN
    ALTER TABLE public.validation_requests ADD COLUMN document_url TEXT;
  END IF;
END $$;

-- CONFIGURATION DU STOCKAGE (À exécuter dans l'éditeur SQL Supabase si possible)
-- Crée le bucket "proofs" pour les justificatifs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de sécurité pour le stockage
-- Autoriser les utilisateurs authentifiés à uploader des fichiers
DROP POLICY IF EXISTS "Permettre l'upload aux authentifiés" ON storage.objects;
CREATE POLICY "Permettre l'upload aux authentifiés" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'proofs');

-- Autoriser tout le monde à voir les fichiers (public: true ci-dessus)
DROP POLICY IF EXISTS "Accès public en lecture" ON storage.objects;
CREATE POLICY "Accès public en lecture" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'proofs');

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meal_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  cook_id UUID REFERENCES profiles(id),
  meal_description TEXT,
  students_count INTEGER,
  photos TEXT[],
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. FONCTIONS DE SÉCURITÉ
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
    OR (auth.jwt() ->> 'email' IN ('honvoumerveille@gmail.com', 'arianaudelegbede1@gmail.com'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. TRIGGER POUR CRÉATION DE PROFIL AUTOMATIQUE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB;
  role_at TEXT;
  name_at TEXT;
  is_val BOOLEAN;
BEGIN
  meta := NEW.raw_user_meta_data;
  
  -- S'assurer que meta n'est pas null pour les extractions
  IF meta IS NULL THEN
    meta := '{}'::jsonb;
  END IF;

  role_at := UPPER(TRIM(meta->>'role'));
  IF role_at NOT IN ('SUPER_ADMIN', 'DIRECTOR', 'COOK') THEN
    role_at := NULL;
  END IF;

  name_at := COALESCE(meta->>'full_name', meta->>'name', '');
  
  is_val := CASE 
    WHEN meta->>'is_validated' = 'true' THEN true 
    ELSE false 
  END;

  INSERT INTO public.profiles (id, full_name, role, is_validated)
  VALUES (NEW.id, name_at, role_at, is_val)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_validated = EXCLUDED.is_validated;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback ultime : on insère juste l'ID pour ne pas bloquer la transaction Auth
  -- On utilise un bloc anonyme pour ignorer les erreurs d'insertion ici aussi
  BEGIN
    INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- On ne peut vraiment rien faire de plus, on retourne NEW pour sauver le record Auth
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. POLITIQUES RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_reports ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
CREATE POLICY "Profiles are viewable by owner" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins view all profiles" ON profiles;
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins update profiles" ON profiles;
CREATE POLICY "Admins update profiles" ON profiles FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Schools
DROP POLICY IF EXISTS "Schools are viewable by authenticated users" ON schools;
CREATE POLICY "Schools are viewable by authenticated users" ON schools 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Admins manage schools" ON schools;
CREATE POLICY "Admins manage schools" ON schools 
  FOR ALL TO authenticated 
  USING (is_admin())
  WITH CHECK (is_admin());

-- Inventory
DROP POLICY IF EXISTS "Inventory access" ON inventory;
CREATE POLICY "Inventory access" ON inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (school_id = inventory.school_id OR role = 'SUPER_ADMIN'))
);

-- Meal Reports
DROP POLICY IF EXISTS "Meal reports access" ON meal_reports;
CREATE POLICY "Meal reports access" ON meal_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (school_id = meal_reports.school_id OR role = 'SUPER_ADMIN'))
);

-- Validation Requests
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all validation requests" ON validation_requests;
CREATE POLICY "Admins view all validation requests" ON validation_requests FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can create validation request" ON validation_requests;
CREATE POLICY "Users can create validation request" ON validation_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own validation request" ON validation_requests;
CREATE POLICY "Users view own validation request" ON validation_requests FOR SELECT USING (auth.uid() = user_id);
