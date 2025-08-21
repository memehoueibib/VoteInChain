import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');
  console.error('📋 Pour configurer Supabase:');
  console.error('1. Créez un fichier .env à la racine du projet');
  console.error('2. Ajoutez: VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('3. Ajoutez: VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('4. Redémarrez le serveur: npm run dev');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('🔧 Client Supabase initialisé:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
});