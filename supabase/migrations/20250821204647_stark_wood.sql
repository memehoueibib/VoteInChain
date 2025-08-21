/*
  # Corriger la contrainte unique sur wallet_address

  1. Problème identifié
    - La contrainte `votes_wallet_address_key` empêche plusieurs votes avec la même adresse wallet
    - Cela bloque les utilisateurs qui veulent voter dans plusieurs sessions

  2. Solution
    - Supprimer la contrainte unique sur `wallet_address` seule
    - Garder la contrainte unique sur `(voter_id, session_id)` pour éviter le double vote par session
    - Permettre à une même adresse wallet de voter dans différentes sessions

  3. Sécurité maintenue
    - Un utilisateur ne peut toujours voter qu'une fois par session
    - La contrainte `votes_voter_session_unique` reste active
*/

-- Supprimer la contrainte unique sur wallet_address
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_wallet_address_key' 
    AND table_name = 'votes'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_wallet_address_key;
  END IF;
END $$;

-- Vérifier que la contrainte unique sur (voter_id, session_id) existe toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_voter_session_unique' 
    AND table_name = 'votes'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_voter_session_unique UNIQUE (voter_id, session_id);
  END IF;
END $$;