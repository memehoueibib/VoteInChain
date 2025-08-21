import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Vote, Calendar, Users, Clock, Play, Pause, BarChart3 } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';
import CounterAnimation from '../UI/CounterAnimation';

interface VotingSession {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  total_votes: number;
  created_at: string;
}

interface ActiveVotingSessionsProps {
  onNavigate: (view: string) => void;
}

const ActiveVotingSessions: React.FC<ActiveVotingSessionsProps> = ({ onNavigate }) => {
  const { profile } = useSupabase();
  const { supabase } = useSupabase();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      console.log('🔍 Récupération des sessions actives...');
      
      if (!supabase) {
        console.error('❌ Client Supabase non disponible');
        return;
      }
      
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Sessions récupérées:', data?.length || 0);
      setSessions(data || []);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des sessions:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les sessions de vote'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    if (!profile?.is_admin) {
      addToast({
        type: 'error',
        title: 'Accès refusé',
        message: 'Seuls les administrateurs peuvent modifier les sessions'
      });
      return;
    }

    if (!supabase) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Client Supabase non disponible'
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('voting_sessions')
        .update({ is_active: !currentStatus })
        .eq('id', sessionId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Session mise à jour',
        message: `Session ${!currentStatus ? 'activée' : 'désactivée'} avec succès`
      });

      fetchActiveSessions();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de mettre à jour la session'
      });
    }
  };

  const getTimeRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Terminé';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}j ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  if (loading) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-slate-400">Chargement des sessions...</span>
        </div>
      </GlassCard>
    );
  }

  if (sessions.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <Vote className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Aucune session active</h3>
        <p className="text-slate-400 mb-6">
          Il n'y a actuellement aucune session de vote en cours.
        </p>
        {profile?.is_admin && (
          <GradientButton
            onClick={() => onNavigate('voting-sessions')}
            className="inline-flex items-center space-x-2"
          >
            <Vote className="w-5 h-5" />
            <span>Créer une Session</span>
          </GradientButton>
        )}
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Sessions de Vote Actives</h2>
        {profile?.is_admin && (
          <div className="flex space-x-3">
            <GradientButton
              onClick={() => onNavigate('create-session')}
              className="flex items-center space-x-2"
            >
              <Vote className="w-4 h-4" />
              <span>Créer un Vote</span>
            </GradientButton>
            <GradientButton
              onClick={() => onNavigate('voting-sessions')}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Vote className="w-4 h-4" />
              <span>Gérer</span>
            </GradientButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6 hover:scale-105 transition-transform duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {session.title}
                  </h3>
                  {session.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                      {session.description}
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  session.is_active 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {session.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-400">Début:</span>
                  </div>
                  <span className="text-white">
                    {new Date(session.start_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {session.end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-slate-400">Fin:</span>
                    </div>
                    <span className="text-white">
                      {getTimeRemaining(session.end_date)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400">Votes:</span>
                  </div>
                  <span className="text-cyan-400 font-semibold">
                    <CounterAnimation end={session.total_votes} />
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <GradientButton
                  onClick={() => onNavigate('voting')}
                  className="flex-1 flex items-center justify-center space-x-2"
                  disabled={!session.is_active}
                >
                  <Vote className="w-4 h-4" />
                  <span>Voter</span>
                </GradientButton>

                <GradientButton
                  onClick={() => {
                    sessionStorage.setItem('selectedVotingSession', session.id);
                    onNavigate('results');
                  }}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Résultats</span>
                </GradientButton>

                {profile?.is_admin && (
                  <button
                    onClick={() => toggleSessionStatus(session.id, session.is_active)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      session.is_active
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {session.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActiveVotingSessions;