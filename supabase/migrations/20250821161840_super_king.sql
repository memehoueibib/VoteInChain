/*
  # Système de Vote Démocratique

  1. Nouvelles Tables
    - `voting_sessions` avec `created_by` pour identifier le créateur
    - `session_participants` pour gérer qui peut voter dans chaque session
    - `session_candidates` pour lier candidats et sessions
    
  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour que chaque utilisateur gère ses propres sessions
    - Auto-inscription des utilisateurs existants comme participants potentiels
    
  3. Fonctionnalités
    - Tout utilisateur peut créer une session
    - Le créateur est admin de sa session uniquement
    - Sélection des participants parmi les utilisateurs existants
    - Candidats peuvent être des utilisateurs existants ou externes
*/

-- Modifier la table voting_sessions pour ajouter le créateur
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'public';
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT NULL;

-- Table pour gérer les participants de chaque session
CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES voting_sessions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES profiles(id),
  status text DEFAULT 'invited', -- invited, accepted, declined
  can_vote boolean DEFAULT true,
  invited_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(session_id, participant_id)
);

-- Table pour lier candidats et sessions (un candidat peut être dans plusieurs sessions)
CREATE TABLE IF NOT EXISTS session_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES voting_sessions(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  added_by uuid REFERENCES profiles(id),
  added_at timestamptz DEFAULT now(),
  UNIQUE(session_id, candidate_id)
);

-- Modifier la table candidates pour supporter les candidats utilisateurs
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS candidate_type text DEFAULT 'external'; -- 'user' ou 'external'

-- Modifier la table votes pour référencer la session
ALTER TABLE votes ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES voting_sessions(id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_participant ON session_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_candidates_session ON session_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);

-- Activer RLS
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_candidates ENABLE ROW LEVEL SECURITY;

-- Politiques pour session_participants
CREATE POLICY "Créateurs peuvent gérer leurs participants"
  ON session_participants
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM voting_sessions 
      WHERE created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Participants peuvent voir leurs invitations"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (
    participant_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Politiques pour session_candidates
CREATE POLICY "Créateurs peuvent gérer leurs candidats"
  ON session_candidates
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM voting_sessions 
      WHERE created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Participants peuvent voir les candidats de leurs sessions"
  ON session_candidates
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT sp.session_id FROM session_participants sp
      WHERE sp.participant_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND sp.status = 'accepted'
    )
  );

-- Politique pour voting_sessions - tout le monde peut voir les sessions publiques
CREATE POLICY "Tout le monde peut voir les sessions publiques" ON voting_sessions
  FOR SELECT TO authenticated
  USING (session_type = 'public' OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Politique pour que les créateurs puissent modifier leurs sessions
CREATE POLICY "Créateurs peuvent modifier leurs sessions" ON voting_sessions
  FOR ALL TO authenticated
  USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Fonction pour auto-ajouter le créateur comme participant
CREATE OR REPLACE FUNCTION add_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO session_participants (session_id, participant_id, invited_by, status)
  VALUES (NEW.id, NEW.created_by, NEW.created_by, 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-ajouter le créateur
DROP TRIGGER IF EXISTS on_session_created ON voting_sessions;
CREATE TRIGGER on_session_created
  AFTER INSERT ON voting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_participant();

-- Fonction pour créer un candidat utilisateur
CREATE OR REPLACE FUNCTION create_user_candidate(
  user_profile_id uuid,
  session_id uuid
)
RETURNS uuid AS $$
DECLARE
  candidate_id uuid;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Récupérer les infos du profil utilisateur
  SELECT * INTO user_profile FROM profiles WHERE id = user_profile_id;
  
  -- Créer le candidat basé sur l'utilisateur
  INSERT INTO candidates (
    name, 
    description, 
    user_id, 
    candidate_type,
    vote_count,
    is_active
  ) VALUES (
    COALESCE(user_profile.full_name, user_profile.email),
    'Candidat utilisateur: ' || user_profile.email,
    user_profile_id,
    'user',
    0,
    true
  ) RETURNING id INTO candidate_id;
  
  -- Lier le candidat à la session
  INSERT INTO session_candidates (session_id, candidate_id, added_by)
  VALUES (session_id, candidate_id, user_profile_id);
  
  RETURN candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW session_details AS
SELECT 
  vs.*,
  p.full_name as creator_name,
  p.email as creator_email,
  (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = vs.id AND sp.status = 'accepted') as participant_count,
  (SELECT COUNT(*) FROM session_candidates sc WHERE sc.session_id = vs.id) as candidate_count
FROM voting_sessions vs
LEFT JOIN profiles p ON vs.created_by = p.id;