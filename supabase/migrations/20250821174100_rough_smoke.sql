/*
  # Correction du système de vote

  1. Corrections
    - Ajout de session_id dans la table votes
    - Correction des triggers pour les compteurs
    - Amélioration des politiques RLS

  2. Sécurité
    - Vérification que l'utilisateur est participant
    - Un seul vote par session par utilisateur
    - Mise à jour automatique des compteurs
*/

-- Ajouter session_id à la table votes si pas déjà présent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE votes ADD COLUMN session_id uuid REFERENCES voting_sessions(id);
  END IF;
END $$;

-- Supprimer l'ancienne contrainte unique sur voter_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'votes_voter_id_key'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_voter_id_key;
  END IF;
END $$;

-- Ajouter nouvelle contrainte unique : un vote par utilisateur par session
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'votes_voter_session_unique'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_voter_session_unique UNIQUE (voter_id, session_id);
  END IF;
END $$;

-- Fonction pour mettre à jour les compteurs de votes
CREATE OR REPLACE FUNCTION update_vote_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter le compteur du candidat
  UPDATE candidates 
  SET vote_count = vote_count + 1 
  WHERE id = NEW.candidate_id;
  
  -- Incrémenter le compteur de la session
  UPDATE voting_sessions 
  SET total_votes = total_votes + 1 
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_vote_cast ON votes;

-- Créer le nouveau trigger
CREATE TRIGGER on_vote_cast
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counters();

-- Mettre à jour les politiques RLS pour les votes
DROP POLICY IF EXISTS "Participants peuvent voter dans leurs sessions" ON votes;
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres votes" ON votes;

-- Nouvelle politique : seuls les participants peuvent voter
CREATE POLICY "Participants peuvent voter dans leurs sessions"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Vérifier que l'utilisateur est participant de la session
    session_id IN (
      SELECT sp.session_id 
      FROM session_participants sp
      JOIN profiles p ON sp.participant_id = p.id
      WHERE p.user_id = auth.uid() 
      AND sp.status = 'accepted'
    )
    AND voter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politique pour voir les votes
CREATE POLICY "Participants peuvent voir les votes de leur session"
  ON votes
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT sp.session_id 
      FROM session_participants sp
      JOIN profiles p ON sp.participant_id = p.id
      WHERE p.user_id = auth.uid() 
      AND sp.status = 'accepted'
    )
  );

-- Recalculer les compteurs existants
UPDATE candidates SET vote_count = (
  SELECT COUNT(*) FROM votes WHERE candidate_id = candidates.id
);

UPDATE voting_sessions SET total_votes = (
  SELECT COUNT(*) FROM votes WHERE session_id = voting_sessions.id
);