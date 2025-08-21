/*
  # Correction des politiques RLS pour le système de vote démocratique

  1. Politiques pour voting_sessions
    - Permettre à tous les utilisateurs connectés de créer des sessions
    - Permettre de voir toutes les sessions publiques
    - Permettre aux créateurs de gérer leurs sessions

  2. Politiques pour profiles
    - Permettre à tous les utilisateurs connectés de voir les autres profils
    - Permettre de mettre à jour son propre profil

  3. Politiques pour session_participants
    - Permettre aux créateurs de gérer les participants
    - Permettre aux participants de voir leurs invitations

  4. Politiques pour session_candidates
    - Permettre aux créateurs de gérer les candidats
    - Permettre aux participants de voir les candidats

  5. Politiques pour candidates
    - Permettre à tous de voir les candidats actifs
    - Permettre aux créateurs de gérer leurs candidats
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Créateurs peuvent modifier leurs sessions" ON voting_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir les sessions actives" ON voting_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir les sessions publiques" ON voting_sessions;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur profil" ON profiles;
DROP POLICY IF EXISTS "Création automatique du profil" ON profiles;

DROP POLICY IF EXISTS "Créateurs peuvent gérer leurs participants" ON session_participants;
DROP POLICY IF EXISTS "Participants peuvent voir leurs invitations" ON session_participants;

DROP POLICY IF EXISTS "Créateurs peuvent gérer leurs candidats" ON session_candidates;
DROP POLICY IF EXISTS "Participants peuvent voir les candidats de leurs sessions" ON session_candidates;

DROP POLICY IF EXISTS "Tout le monde peut voir les candidats" ON candidates;
DROP POLICY IF EXISTS "Seuls les admins peuvent gérer les candidats" ON candidates;

-- Nouvelles politiques pour voting_sessions
CREATE POLICY "Utilisateurs connectés peuvent créer des sessions"
  ON voting_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Tout le monde peut voir les sessions publiques"
  ON voting_sessions
  FOR SELECT
  TO authenticated
  USING (session_type = 'public' OR created_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Créateurs peuvent modifier leurs sessions"
  ON voting_sessions
  FOR UPDATE
  TO authenticated
  USING (created_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Créateurs peuvent supprimer leurs sessions"
  ON voting_sessions
  FOR DELETE
  TO authenticated
  USING (created_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Nouvelles politiques pour profiles
CREATE POLICY "Utilisateurs connectés peuvent voir tous les profils"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur propre profil"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Création automatique du profil"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Nouvelles politiques pour session_participants
CREATE POLICY "Créateurs peuvent gérer les participants de leurs sessions"
  ON session_participants
  FOR ALL
  TO authenticated
  USING (session_id IN (
    SELECT id FROM voting_sessions 
    WHERE created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Participants peuvent voir leurs invitations"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (participant_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Nouvelles politiques pour session_candidates
CREATE POLICY "Créateurs peuvent gérer les candidats de leurs sessions"
  ON session_candidates
  FOR ALL
  TO authenticated
  USING (session_id IN (
    SELECT id FROM voting_sessions 
    WHERE created_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Participants peuvent voir les candidats des sessions où ils participent"
  ON session_candidates
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM session_participants 
      WHERE participant_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    OR 
    session_id IN (
      SELECT id FROM voting_sessions WHERE session_type = 'public'
    )
  );

-- Nouvelles politiques pour candidates
CREATE POLICY "Tout le monde peut voir les candidats actifs"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Utilisateurs connectés peuvent créer des candidats"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Créateurs peuvent modifier leurs candidats"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT candidate_id FROM session_candidates sc
      JOIN voting_sessions vs ON sc.session_id = vs.id
      WHERE vs.created_by IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Créateurs peuvent supprimer leurs candidats"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT candidate_id FROM session_candidates sc
      JOIN voting_sessions vs ON sc.session_id = vs.id
      WHERE vs.created_by IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Nouvelles politiques pour votes
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs votes" ON votes;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voter une seule fois" ON votes;

CREATE POLICY "Utilisateurs peuvent voir leurs propres votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (voter_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Participants peuvent voter dans leurs sessions"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    AND
    session_id IN (
      SELECT session_id FROM session_participants 
      WHERE participant_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
      AND status = 'accepted'
    )
  );

-- Assurer que RLS est activé sur toutes les tables
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;