/*
  # Ajouter de vrais candidats pour l'équipe

  1. Suppression des anciens candidats de test
  2. Ajout des vrais membres de l'équipe
  3. Configuration des positions et descriptions
*/

-- Supprimer les anciens candidats de test
DELETE FROM candidates WHERE name IN ('Test Candidate', 'Demo User', 'Sample Person');

-- Ajouter les vrais candidats de l'équipe
INSERT INTO candidates (name, description, party, image_url, vote_count, position, is_active) VALUES
(
  'Carolina HENAO URIBE',
  'Experte en innovation technologique avec une passion pour les solutions blockchain. Leader naturelle avec une vision stratégique pour l''avenir de notre équipe.',
  'Tech Innovation Party',
  'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  1,
  true
),
(
  'Meme HOUEIBIB',
  'Développeur full-stack expérimenté, spécialisé dans les architectures modernes et les bonnes pratiques de développement.',
  'Progressive Alliance',
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  2,
  true
),
(
  'Marwane ZAIM SASSI',
  'Expert en cybersécurité et blockchain, passionné par la création de systèmes sécurisés et innovants.',
  'Security & Innovation Coalition',
  'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  3,
  true
),
(
  'Mouad KARROUM',
  'Visionnaire du Web3 et des technologies décentralisées, avec une expertise approfondie en smart contracts.',
  'Web3 Future Movement',
  'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  4,
  true
),
(
  'Roa CHAIR',
  'Spécialiste DevOps et infrastructure cloud, expert en automatisation et déploiement continu.',
  'DevOps Excellence Party',
  'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  5,
  true
),
(
  'Saad EL MATBAI',
  'Expert en assurance qualité et tests automatisés, garant de la fiabilité de nos applications.',
  'Quality Assurance Alliance',
  'https://images.pexels.com/photos/2182971/pexels-photo-2182971.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  6,
  true
),
(
  'Ismail BRAHIMI',
  'Architecte de données et expert en bases de données, spécialisé dans l''optimisation des performances.',
  'Data Management Coalition',
  'https://images.pexels.com/photos/2379006/pexels-photo-2379006.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  7,
  true
),
(
  'Fatima-Zohra BAKALI',
  'Responsable communication et documentation technique, experte en création de contenu et formation.',
  'Communication & Documentation Party',
  'https://images.pexels.com/photos/3785080/pexels-photo-3785080.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  8,
  true
),
(
  'Enzo SEGHI',
  'Designer UX/UI créatif, spécialisé dans la création d''expériences utilisateur exceptionnelles.',
  'Creative Design Movement',
  'https://images.pexels.com/photos/2182972/pexels-photo-2182972.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  9,
  true
),
(
  'Vladimir KREMNEV',
  'Architecte backend senior, expert en systèmes distribués et architectures haute performance.',
  'Backend Architecture Alliance',
  'https://images.pexels.com/photos/2379007/pexels-photo-2379007.jpeg?auto=compress&cs=tinysrgb&w=400',
  0,
  10,
  true
);

-- Créer des comptes utilisateurs de test pour chaque candidat
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES 
(gen_random_uuid(), 'carolina.henao@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carolina HENAO URIBE"}', false, 'authenticated'),
(gen_random_uuid(), 'meme.houeibib@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Meme HOUEIBIB"}', false, 'authenticated'),
(gen_random_uuid(), 'marwane.zaimsassi@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marwane ZAIM SASSI"}', false, 'authenticated'),
(gen_random_uuid(), 'mouad.karroum@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mouad KARROUM"}', false, 'authenticated'),
(gen_random_uuid(), 'roa.chair@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Roa CHAIR"}', false, 'authenticated'),
(gen_random_uuid(), 'saad.elmatbai@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Saad EL MATBAI"}', false, 'authenticated'),
(gen_random_uuid(), 'ismail.brahimi@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ismail BRAHIMI"}', false, 'authenticated'),
(gen_random_uuid(), 'fatima.bakali@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima-Zohra BAKALI"}', false, 'authenticated'),
(gen_random_uuid(), 'enzo.seghi@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Enzo SEGHI"}', false, 'authenticated'),
(gen_random_uuid(), 'vladimir.kremnev@voteinchain.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vladimir KREMNEV"}', false, 'authenticated');

-- Créer une session de vote active
INSERT INTO voting_sessions (title, description, is_active, start_date, end_date, total_votes) VALUES
(
  'Élection du Représentant de l''Équipe Tech 2024',
  'Élection pour choisir le représentant officiel de notre équipe de développement. Cette personne sera notre porte-parole et coordinateur principal.',
  true,
  now(),
  now() + interval '30 days',
  0
);