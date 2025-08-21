// 🔍 FICHIER DE TEST POUR DIAGNOSTIQUER LES PROBLÈMES
// Exécutez ce fichier avec: node debug-test.js

import fs from 'fs';
import path from 'path';

console.log('🚀 DÉBUT DES TESTS DE DIAGNOSTIC VoteInChain');
console.log('='.repeat(50));

// Test 1: Vérifier la structure des fichiers
console.log('\n📁 TEST 1: Vérification de la structure des fichiers');

const filesToCheck = [
  'src/App.tsx',
  'src/components/Admin/CreateVotingSessionPage.tsx',
  'src/components/Dashboard/Dashboard.tsx',
  'src/hooks/useSupabase.ts',
  'src/components/Navigation/Navbar.tsx'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - EXISTE`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// Test 2: Vérifier les imports dans App.tsx
console.log('\n📦 TEST 2: Vérification des imports dans App.tsx');
try {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  
  const importsToCheck = [
    'CreateVotingSessionPage',
    'Dashboard',
    'VotingPage',
    'AdminPanel'
  ];
  
  importsToCheck.forEach(importName => {
    if (appContent.includes(importName)) {
      console.log(`✅ Import ${importName} - TROUVÉ`);
    } else {
      console.log(`❌ Import ${importName} - MANQUANT`);
    }
  });
} catch (error) {
  console.log('❌ Erreur lecture App.tsx:', error.message);
}

// Test 3: Vérifier les routes dans App.tsx
console.log('\n🛣️ TEST 3: Vérification des routes');
try {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  
  const routesToCheck = [
    'create-session',
    'dashboard',
    'voting',
    'admin'
  ];
  
  routesToCheck.forEach(route => {
    if (appContent.includes(`'${route}'`)) {
      console.log(`✅ Route ${route} - TROUVÉE`);
    } else {
      console.log(`❌ Route ${route} - MANQUANTE`);
    }
  });
} catch (error) {
  console.log('❌ Erreur vérification routes:', error.message);
}

// Test 4: Vérifier le contenu du Dashboard
console.log('\n📊 TEST 4: Vérification du Dashboard');
try {
  const dashboardContent = fs.readFileSync('src/components/Dashboard/Dashboard.tsx', 'utf8');
  
  if (dashboardContent.includes('Créer un Vote') || dashboardContent.includes('create-session')) {
    console.log('✅ Bouton "Créer un Vote" - TROUVÉ dans Dashboard');
  } else {
    console.log('❌ Bouton "Créer un Vote" - MANQUANT dans Dashboard');
  }
} catch (error) {
  console.log('❌ Erreur lecture Dashboard:', error.message);
}

// Test 5: Vérifier les variables d'environnement
console.log('\n🔧 TEST 5: Vérification des variables d\'environnement');
try {
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('✅ Fichier .env - EXISTE');
    
    const envVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    envVars.forEach(envVar => {
      if (envContent.includes(envVar)) {
        console.log(`✅ ${envVar} - DÉFINIE`);
      } else {
        console.log(`❌ ${envVar} - MANQUANTE`);
      }
    });
  } else {
    console.log('❌ Fichier .env - MANQUANT');
  }
} catch (error) {
  console.log('❌ Erreur lecture .env:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 FIN DES TESTS DE DIAGNOSTIC');
console.log('\n💡 INSTRUCTIONS:');
console.log('1. Exécutez: node debug-test.js');
console.log('2. Vérifiez les résultats ci-dessus');
console.log('3. Corrigez les éléments marqués ❌');
console.log('4. Redémarrez le serveur: npm run dev');