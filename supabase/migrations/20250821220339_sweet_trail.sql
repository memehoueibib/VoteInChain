/*
  # Définir demo@demo.com comme administrateur

  1. Objectif
    - Promouvoir l'utilisateur demo@demo.com au statut d'administrateur
    - Permettre la gestion complète de la plateforme

  2. Actions
    - Mise à jour du profil pour is_admin = true
    - Vérification que l'utilisateur existe

  3. Sécurité
    - Utilise une condition WHERE sécurisée
    - Ne modifie que l'utilisateur spécifique
*/

-- Mettre à jour le statut admin pour demo@demo.com
UPDATE profiles 
SET is_admin = true 
WHERE email = 'demo@demo.com';

-- Vérifier que la mise à jour a fonctionné
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM profiles 
    WHERE email = 'demo@demo.com' AND is_admin = true;
    
    IF user_count > 0 THEN
        RAISE NOTICE 'SUCCESS: demo@demo.com est maintenant administrateur';
    ELSE
        RAISE NOTICE 'WARNING: Utilisateur demo@demo.com non trouvé ou mise à jour échouée';
    END IF;
END $$;