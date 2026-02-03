-- TourneyHub Database Schema
-- Run this in Supabase SQL Editor

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'owner')),
  nickname TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  preferred_games TEXT[] DEFAULT '{}',
  elo JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"played": 0, "won": 0, "top3": 0}',
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OWNERS TABLE (for role = 'owner')
-- =============================================
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  vat_number TEXT,
  business_email TEXT,
  business_phone TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STORES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'IT',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  opening_hours JSONB DEFAULT '{}',
  logo_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEAGUES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('magic', 'pokemon', 'onepiece', 'yugioh', 'other')),
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'in_progress', 'completed', 'cancelled')),
  standings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECURRING SCHEDULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template JSONB NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INT CHECK (day_of_month >= 1 AND day_of_month <= 31),
  time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  next_occurrence DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TOURNAMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('magic', 'pokemon', 'onepiece', 'yugioh', 'other')),
  format TEXT CHECK (format IN ('swiss', 'single_elimination', 'round_robin', 'other')),
  description TEXT,
  rules TEXT,
  prizes TEXT,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE,
  end_time TIME,
  max_participants INT,
  min_participants INT DEFAULT 2,
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  registration_closes_minutes_before INT DEFAULT 30,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'in_progress', 'completed', 'cancelled')),
  image_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL,
  league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REGISTRATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'present', 'absent', 'withdrawn', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('store', 'stripe')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  position INT,
  points INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- =============================================
-- TOURNAMENT TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tournament_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_owners_subscription ON owners(subscription_status);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_tournaments_store ON tournaments(store_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_player ON registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nickname');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- OWNERS policies
CREATE POLICY "Owners are viewable by everyone" 
  ON owners FOR SELECT 
  USING (true);

CREATE POLICY "Owners can manage own data" 
  ON owners FOR ALL 
  USING (auth.uid() = id);

-- STORES policies
CREATE POLICY "Stores are viewable by everyone" 
  ON stores FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Owners can view all own stores" 
  ON stores FOR SELECT 
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can manage own stores" 
  ON stores FOR ALL 
  USING (owner_id = auth.uid());

-- TOURNAMENTS policies
CREATE POLICY "Published tournaments are viewable by everyone" 
  ON tournaments FOR SELECT 
  USING (status != 'draft' OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can manage tournaments of own stores" 
  ON tournaments FOR ALL 
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- REGISTRATIONS policies
CREATE POLICY "Registrations are viewable by tournament owner and player" 
  ON registrations FOR SELECT 
  USING (
    player_id = auth.uid() OR 
    tournament_id IN (
      SELECT t.id FROM tournaments t 
      JOIN stores s ON t.store_id = s.id 
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Players can register themselves" 
  ON registrations FOR INSERT 
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Players can update own registration" 
  ON registrations FOR UPDATE 
  USING (player_id = auth.uid());

CREATE POLICY "Owners can manage registrations of own tournaments" 
  ON registrations FOR ALL 
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t 
      JOIN stores s ON t.store_id = s.id 
      WHERE s.owner_id = auth.uid()
    )
  );

-- TOURNAMENT TEMPLATES policies
CREATE POLICY "Owners can manage own templates" 
  ON tournament_templates FOR ALL 
  USING (owner_id = auth.uid());

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- LEAGUES policies
CREATE POLICY "Leagues are viewable by everyone" 
  ON leagues FOR SELECT 
  USING (status != 'draft' OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can manage leagues of own stores" 
  ON leagues FOR ALL 
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- RECURRING SCHEDULES policies
CREATE POLICY "Owners can manage own schedules" 
  ON recurring_schedules FOR ALL 
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Run these in Supabase Dashboard -> Storage

-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('store-logos', 'store-logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('store-banners', 'store-banners', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-images', 'tournament-images', true);

-- Storage policies
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
