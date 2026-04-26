-- 1. Table des profils utilisateurs (complète auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('SUPER_ADMIN', 'DIRECTOR', 'COOK')),
  cip_number TEXT, -- Uniquement pour l'admin
  school_id UUID, -- NULL pour les Super Admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des écoles
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  commune TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des stocks (Vivres)
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table des rapports de repas quotidiens
CREATE TABLE meal_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  cook_id UUID REFERENCES profiles(id),
  meal_description TEXT,
  students_count INTEGER,
  photos TEXT[], -- Array de URLs d'images
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACTIVER LE RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_reports ENABLE ROW LEVEL SECURITY;

-- POLITIQUES DE SÉCURITÉ (Exemples)
-- Tout le monde peut lire son propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Super Admin peut tout voir
CREATE POLICY "Admins can view everything" ON schools
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- Directeurs voient leur école et leur stock
CREATE POLICY "Directors view own school" ON schools
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (school_id = schools.id OR role = 'SUPER_ADMIN')));

CREATE POLICY "Directors manage own stock" ON inventory
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (school_id = inventory.school_id OR role = 'SUPER_ADMIN')));
