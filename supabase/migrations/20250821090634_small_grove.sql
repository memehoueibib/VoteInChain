/*
  # Système de vote blockchain VoteInChain

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs avec adresses wallet
    - `candidates` - Candidats à l'élection
    - `votes` - Enregistrement des votes
    - `voting_sessions` - Sessions de vote

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour utilisateurs authentifiés
    - Protection contre le double vote
*/

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  wallet_address TEXT UNIQUE,
  has_voted BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des candidats
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  party TEXT,
  image_url TEXT,
  vote_count INTEGER DEFAULT 0,
  position INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID REFERENCES profiles(id),
  candidate_id UUID REFERENCES candidates(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT,
  block_number INTEGER,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(voter_id),
  UNIQUE(wallet_address)
);

-- Table des sessions de vote
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur profil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Création automatique du profil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour candidates
CREATE POLICY "Tout le monde peut voir les candidats"
  ON candidates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Seuls les admins peuvent gérer les candidats"
  ON candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Politiques RLS pour votes
CREATE POLICY "Les utilisateurs peuvent voir leurs votes"
  ON votes FOR SELECT
  TO authenticated
  USING (
    voter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent voter une seule fois"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politiques RLS pour voting_sessions
CREATE POLICY "Tout le monde peut voir les sessions actives"
  ON voting_sessions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insérer les candidats de test
INSERT INTO candidates (name, party, description, image_url, position) VALUES
  ('Alice Johnson', 'Parti Progressiste', 'Focus sur l''éducation et la réforme de la santé', 'https://i.pravatar.cc/300?img=1', 1),
  ('Bob Martinez', 'Parti de Croissance Économique', 'Développement des entreprises et création d''emplois', 'https://i.pravatar.cc/300?img=2', 2),
  ('Clara Chen', 'Parti Environnemental', 'Action climatique et durabilité', 'https://i.pravatar.cc/300?img=3', 3),
  ('David Wilson', 'Parti de Justice Sociale', 'Égalité et réformes sociales', 'https://i.pravatar.cc/300?img=4', 4),
  ('Emma Davis', 'Parti Innovation Technologique', 'Transformation numérique et innovation', 'https://i.pravatar.cc/300?img=5', 5);

-- Créer une session de vote active
INSERT INTO voting_sessions (title, description, is_active) VALUES
  ('Élection Présidentielle 2024', 'Élection présidentielle avec vote blockchain sécurisé', true);

-- Fonction pour mettre à jour le compteur de votes
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE candidates 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.candidate_id;
    
    UPDATE profiles 
    SET has_voted = true 
    WHERE id = NEW.voter_id;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les compteurs
DROP TRIGGER IF EXISTS on_vote_cast ON votes;
CREATE TRIGGER on_vote_cast
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();