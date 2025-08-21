/*
  # Nettoyage complet des données de vote

  1. Suppression des données
    - Supprime tous les votes
    - Supprime toutes les sessions et leurs relations
    - Supprime tous les candidats
    - Remet les compteurs à zéro
  
  2. Sécurité
    - Préserve les profils utilisateurs
    - Préserve les permissions et politiques RLS
    - Remet les séquences à zéro pour des IDs propres
*/

-- Désactiver temporairement les triggers pour éviter les conflits
SET session_replication_role = replica;

-- 1. Supprimer tous les votes
DELETE FROM votes;

-- 2. Supprimer toutes les relations session-candidats
DELETE FROM session_candidates;

-- 3. Supprimer toutes les relations session-participants
DELETE FROM session_participants;

-- 4. Supprimer toutes les sessions de vote
DELETE FROM voting_sessions;

-- 5. Supprimer tous les candidats
DELETE FROM candidates;

-- 6. Remettre les profils à zéro (optionnel - décommentez si nécessaire)
-- UPDATE profiles SET has_voted = false;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- 7. Remettre les séquences à zéro pour des IDs propres (si vous utilisez des séquences)
-- Ceci garantit que les nouveaux enregistrements commenceront à ID = 1

-- Note: Supabase utilise des UUIDs par défaut, donc pas besoin de reset des séquences
-- Mais si vous avez des colonnes avec des séquences, décommentez les lignes suivantes :

-- ALTER SEQUENCE IF EXISTS votes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS candidates_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS voting_sessions_id_seq RESTART WITH 1;

-- Vérification : Compter les enregistrements restants
DO $$
BEGIN
    RAISE NOTICE 'Votes restants: %', (SELECT COUNT(*) FROM votes);
    RAISE NOTICE 'Candidats restants: %', (SELECT COUNT(*) FROM candidates);
    RAISE NOTICE 'Sessions restantes: %', (SELECT COUNT(*) FROM voting_sessions);
    RAISE NOTICE 'Relations session-candidats: %', (SELECT COUNT(*) FROM session_candidates);
    RAISE NOTICE 'Relations session-participants: %', (SELECT COUNT(*) FROM session_participants);
    RAISE NOTICE '✅ Nettoyage terminé - Base de données prête pour de nouvelles données';
END $$;