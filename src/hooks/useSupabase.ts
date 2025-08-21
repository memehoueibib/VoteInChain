import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  wallet_address?: string;
  has_voted: boolean;
  is_admin: boolean;
  created_at: string;
}

interface Candidate {
  id: string;
  name: string;
  description?: string;
  party?: string;
  image_url?: string;
  vote_count: number;
  position?: number;
  is_active: boolean;
  created_at: string;
}

interface VotingSession {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  total_votes: number;
  created_at: string;
}

export const useSupabase = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('🔄 Initialisation useSupabase...');
    
    // Timeout de sécurité pour éviter le chargement infini
    const timeoutId = setTimeout(() => {
      if (!initialized) {
        console.log('⏰ Timeout de chargement atteint, forcer l\'arrêt du loading');
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 secondes maximum
    
    // Récupérer la session actuelle
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Erreur session:', error);
          
          // Si le token de rafraîchissement est invalide, nettoyer la session
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('Auth session missing')) {
            console.log('🧹 Nettoyage de la session invalide...');
            await supabase.auth.signOut();
          }
          
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        console.log('📱 Session récupérée:', session ? '✅ Connecté' : '❌ Non connecté');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ Erreur getSession:', error);
        setLoading(false);
        setInitialized(true);
      } finally {
        if (!user) {
          setLoading(false);
          setInitialized(true);
        }
        clearTimeout(timeoutId);
      }
    };

    getSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? '✅ Connecté' : '❌ Déconnecté');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Récupération du profil pour:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur profil:', error);
        setLoading(false);
        setInitialized(true);
        return;
      }

      console.log('✅ Profil récupéré:', data);
      setProfile(data);
      setLoading(false);
      setInitialized(true);
    } catch (error) {
      console.error('❌ Erreur fetchProfile:', error);
      setLoading(false);
      setInitialized(true);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentative de connexion:', email);
      
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Configuration Supabase manquante. Vérifiez votre fichier .env');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erreur connexion:', error);
        throw error;
      }

      console.log('✅ Connexion réussie:', data.user?.email);
      return data;
    } catch (error) {
      console.error('❌ Erreur signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('📝 Tentative d\'inscription:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Erreur inscription:', error);
        throw error;
      }

      console.log('✅ Inscription réussie:', data.user?.email);
      return data;
    } catch (error) {
      console.error('❌ Erreur signUp:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Déconnexion...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erreur déconnexion:', error);
        throw error;
      }

      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur signOut:', error);
      throw error;
    }
  };

  const fetchCandidates = async (): Promise<Candidate[]> => {
    try {
      console.log('📊 Récupération des candidats...');
      
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Erreur candidats:', error);
        throw error;
      }

      console.log('✅ Candidats récupérés:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur fetchCandidates:', error);
      throw error;
    }
  };

  const fetchVotingSessions = async (): Promise<VotingSession[]> => {
    try {
      console.log('🗳️ Récupération des sessions de vote...');
      
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur sessions:', error);
        throw error;
      }

      console.log('✅ Sessions récupérées:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur fetchVotingSessions:', error);
      throw error;
    }
  };

  const castVote = async (candidateId: string, walletAddress: string) => {
    try {
      console.log('🗳️ Vote en cours...', { candidateId, walletAddress });
      
      if (!profile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      const { data, error } = await supabase
        .from('votes')
        .insert({
          voter_id: profile.id,
          candidate_id: candidateId,
          wallet_address: walletAddress,
        });

      if (error) {
        console.error('❌ Erreur vote:', error);
        throw error;
      }

      console.log('✅ Vote enregistré:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur castVote:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: { full_name?: string; wallet_address?: string }) => {
    try {
      if (!profile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        throw error;
      }

      console.log('✅ Profil mis à jour:', data);
      setProfile(data);
      return true;
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      return false;
    }
  };
  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erreur fetchAllUsers:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    supabase,
    signIn,
    signUp,
    signOut,
    fetchCandidates,
    fetchVotingSessions,
    castVote,
    updateProfile,
    fetchAllUsers,
  };
};