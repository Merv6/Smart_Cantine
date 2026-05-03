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
  role TEXT CHECK (role IN ('SUPER_ADMIN', 'DIRECTOR', 'COOK')),
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

-- Migration pour ajouter school_id si profiles existe déjà
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='school_id') THEN
    ALTER TABLE public.profiles ADD COLUMN school_id UUID REFERENCES public.schools(id);
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
CREATE POLICY "Permettre l'upload aux authentifiés" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'proofs');

-- Autoriser tout le monde à voir les fichiers (public: true ci-dessus)
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
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. TRIGGER POUR CRÉATION DE PROFIL AUTOMATIQUE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_validated)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'role', -- Sera NULL si non fourni lors de l'enregistrement simple
    COALESCE((NEW.raw_user_meta_data->>'is_validated')::boolean, false)
  );
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
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT USING (get_my_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Schools
DROP POLICY IF EXISTS "Schools access" ON schools;
CREATE POLICY "Schools access" ON schools FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (school_id = schools.id OR role = 'SUPER_ADMIN'))
);

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
CREATE POLICY "Admins view all validation requests" ON validation_requests FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "Users can create validation request" ON validation_requests;
CREATE POLICY "Users can create validation request" ON validation_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own validation request" ON validation_requests;
CREATE POLICY "Users view own validation request" ON validation_requests FOR SELECT USING (auth.uid() = user_id);
