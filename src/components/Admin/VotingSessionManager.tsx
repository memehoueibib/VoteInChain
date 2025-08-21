import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Users, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';
import CreateVotingSession from './CreateVotingSession';
import EditVotingSession from './EditVotingSession';

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

interface VotingSessionManagerProps {
  onNavigate: (view: string) => void;
}

const VotingSessionManager: React.FC<VotingSessionManagerProps> = ({ onNavigate }) => {
  const { supabase, profile } = useSupabase();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchSessions();
    }
  }, [profile]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
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

      fetchSessions();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de mettre à jour la session'
      });
    }
  };

  const deleteSession = async (sessionId: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la session "${title}" ?`)) return;

    try {
      const { error } = await supabase
        .from('voting_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Session supprimée',
        message: `La session "${title}" a été supprimée`
      });

      fetchSessions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer la session'
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

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="text-red-400 mb-4">Accès refusé</div>
          <p className="text-slate-400">Vous n'avez pas les permissions d'administrateur.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-4">
                Gestion des Sessions de Vote
              </h1>
              <p className="text-slate-400 text-lg">
                Créez et gérez les sessions d'élection
              </p>
            </div>
            <GradientButton
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nouvelle Session</span>
            </GradientButton>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Sessions',
              value: sessions.length,
              icon: Calendar,
              color: 'from-blue-500 to-cyan-500'
            },
            {
              title: 'Sessions Actives',
              value: sessions.filter(s => s.is_active).length,
              icon: Play,
              color: 'from-green-500 to-emerald-500'
            },
            {
              title: 'Sessions Inactives',
              value: sessions.filter(s => !s.is_active).length,
              icon: Pause,
              color: 'from-orange-500 to-red-500'
            },
            {
              title: 'Total Votes',
              value: sessions.reduce((sum, s) => sum + s.total_votes, 0),
              icon: Users,
              color: 'from-violet-500 to-purple-500'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 text-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.title}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Liste des sessions */}
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      session.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-slate-600 to-slate-500'
                    }`}>
                      {session.is_active ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <XCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {session.title}
                      </h3>
                      {session.description && (
                        <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(session.start_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {session.end_date && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(session.end_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{session.total_votes} votes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleSessionStatus(session.id, session.is_active)}
                      disabled={session.total_votes > 0}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        session.total_votes > 0 
                          ? 'bg-slate-600/50 text-slate-500 cursor-not-allowed'
                          : 
                        session.is_active
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                      title={session.total_votes > 0 ? 'Impossible de modifier une session avec des votes' : ''}
                    >
                      {session.is_active ? (
                        <>
                          <Pause className="w-4 h-4 inline mr-1" />
                          {session.total_votes > 0 ? 'Verrouillé' : 'Désactiver'}
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 inline mr-1" />
                          {session.total_votes > 0 ? 'Verrouillé' : 'Activer'}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        sessionStorage.setItem('selectedVotingSession', session.id);
                        onNavigate('results');
                      }}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium"
                    >
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      Résultats
                    </button>

                    <button
                      onClick={() => setEditingSessionId(session.id)}
                      disabled={session.total_votes > 0}
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                      title={session.total_votes > 0 ? 'Impossible de modifier une session avec des votes' : 'Modifier'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteSession(session.id, session.title)}
                      disabled={session.total_votes > 0}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title={session.total_votes > 0 ? 'Impossible de supprimer une session avec des votes' : 'Supprimer'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Aucune session</h3>
              <p className="text-slate-400 mb-6">
                Commencez par créer votre première session de vote.
              </p>
              <GradientButton
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Créer une Session</span>
              </GradientButton>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Modal de création */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateVotingSession
            onSessionCreated={fetchSessions}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal de modification */}
      <AnimatePresence>
        {editingSessionId && (
          <EditVotingSession
            sessionId={editingSessionId}
            onClose={() => setEditingSessionId(null)}
            onSessionUpdated={fetchSessions}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VotingSessionManager;