import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Users, 
  TrendingUp, 
  Clock, 
  Award,
  ChevronRight,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';
import CounterAnimation from '../UI/CounterAnimation';
import ActiveVotingSessions from './ActiveVotingSessions';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, profile, fetchCandidates, fetchVotingSessions } = useSupabase();
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalCandidates: 0,
    activeSessions: 0,
    userVoted: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('📊 Chargement des données du dashboard...');
        
        const [candidates, sessions] = await Promise.all([
          fetchCandidates(),
          fetchVotingSessions()
        ]);

        const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.vote_count, 0);
        
        setStats({
          totalVotes,
          totalCandidates: candidates.length,
          activeSessions: sessions.length,
          userVoted: profile?.has_voted || false
        });

        console.log('✅ Données dashboard chargées:', {
          totalVotes,
          totalCandidates: candidates.length,
          activeSessions: sessions.length
        });
      } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && profile) {
      loadDashboardData();
    }
  }, [user, profile, fetchCandidates, fetchVotingSessions]);

  const quickActions = [
    {
      title: 'Participer au Vote',
      description: 'Votez pour votre candidat préféré',
      icon: Vote,
      color: 'from-cyan-500 to-blue-500',
      action: () => onNavigate('voting'),
      disabled: profile?.has_voted
    },
    {
      title: 'Voir les Résultats',
      description: 'Consultez les résultats en temps réel',
      icon: BarChart3,
      color: 'from-violet-500 to-purple-500',
      action: () => onNavigate('results')
    },
    {
      title: 'Mon Profil',
      description: 'Gérez vos informations personnelles',
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
      action: () => onNavigate('profile')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête de bienvenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Bienvenue, {' '}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  {profile?.full_name || user?.email?.split('@')[0]}
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl">
                Participez à la révolution démocratique avec VoteInChain. 
                Votre voix compte dans un système transparent et sécurisé.
              </p>
            </div>
            
            {/* Bouton principal de création */}
            <GradientButton
              onClick={() => onNavigate('create-session')}
              className="flex items-center space-x-2 px-6 py-3"
            >
              <Vote className="w-5 h-5" />
              <span>Créer un Vote</span>
            </GradientButton>
          </div>
        </motion.div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: 'Total des Votes',
              value: stats.totalVotes,
              icon: Vote,
              color: 'from-cyan-500 to-blue-500',
              change: '+12%'
            },
            {
              title: 'Candidats Actifs',
              value: stats.totalCandidates,
              icon: Users,
              color: 'from-violet-500 to-purple-500',
              change: '+3'
            },
            {
              title: 'Sessions Actives',
              value: stats.activeSessions,
              icon: Clock,
              color: 'from-emerald-500 to-teal-500',
              change: '+1'
            },
            {
              title: 'Votre Statut',
              value: profile?.has_voted ? 'Voté' : 'En attente',
              icon: Shield,
              color: 'from-orange-500 to-red-500',
              isText: true
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.change && (
                    <span className="text-sm text-emerald-400 font-medium">
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">
                  {stat.title}
                </h3>
                <div className="text-2xl font-bold text-white">
                  {stat.isText ? (
                    stat.value
                  ) : (
                    <CounterAnimation end={Number(stat.value)} duration={2} />
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Sessions de vote actives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <ActiveVotingSessions onNavigate={onNavigate} />
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Zap className="w-6 h-6 mr-3 text-cyan-400" />
              Actions Rapides
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <GlassCard 
                  className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-cyan-500/10'
                  }`}
                  onClick={action.disabled ? undefined : action.action}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    {!action.disabled && (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {action.description}
                  </p>
                  
                  {action.disabled && (
                    <div className="mt-3 text-xs text-orange-400 font-medium">
                      Déjà effectué
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section admin pour les sessions créées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <GlassCard className="p-8 border-2 border-violet-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                  <Award className="w-6 h-6 mr-3 text-yellow-400" />
                  Mes Sessions de Vote
                </h3>
                <p className="text-slate-400">
                  Gérez les sessions de vote que vous avez créées
                </p>
              </div>
              <div className="flex space-x-4">
                <GradientButton
                  onClick={() => onNavigate('voting-sessions')}
                  variant="secondary"
                  className="px-6 py-3"
                >
                  Gérer mes Sessions
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;