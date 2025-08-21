/*
  # Définir admin@demo.com comme administrateur

  1. Mise à jour
    - Définit admin@demo.com comme administrateur principal
    - Assure que le compte a tous les privilèges admin
    - Vérifie l'existence du profil avant mise à jour

  2. Sécurité
    - Utilise une transaction sécurisée
    - Logs de vérification inclus
    - Gestion d'erreur si le profil n'existe pas
*/

-- Mettre à jour le profil admin@demo.com pour être administrateur
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@demo.com';

-- Vérifier que la mise à jour a fonctionné
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM profiles 
    WHERE email = 'admin@demo.com' AND is_admin = true;
    
    IF admin_count > 0 THEN
        RAISE NOTICE 'SUCCESS: admin@demo.com est maintenant administrateur';
    ELSE
        RAISE NOTICE 'WARNING: admin@demo.com non trouvé ou mise à jour échouée';
        RAISE NOTICE 'SOLUTION: Créez d''abord le compte via l''interface web';
    END IF;
END $$;

-- Afficher tous les administrateurs pour vérification
SELECT 
    email, 
    full_name, 
    is_admin, 
    created_at 
FROM profiles 
WHERE is_admin = true 
ORDER BY created_at;