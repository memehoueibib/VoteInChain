import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award,
  RefreshCw,
  Download,
  Share2,
  Eye
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';
import CounterAnimation from '../UI/CounterAnimation';
import ResultsChart from './ResultsChart';

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

interface ResultsPageProps {
  sessionId?: string;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ sessionId }) => {
  const { supabase } = useSupabase();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchResults = async () => {
    try {
      console.log('📊 Récupération des résultats pour session:', sessionId);
      setRefreshing(true);
      
      // Récupérer l'ID de session depuis sessionStorage si pas fourni
      const targetSessionId = sessionId || sessionStorage.getItem('selectedVotingSession');
      
      if (!targetSessionId) {
        console.log('❌ Aucune session sélectionnée');
        setCandidates([]);
        setTotalVotes(0);
        return;
      }
      
      // Récupérer les informations de la session
      const { data: sessionData, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('id', targetSessionId)
        .single();
      
      if (sessionError) throw sessionError;
      setSession(sessionData);
      
      // Récupérer les candidats de cette session spécifique
      const { data: sessionCandidates, error: candidatesError } = await supabase
        .from('session_candidates')
        .select(`
          candidate_id,
          candidates (
            id,
            name,
            description,
            party,
            image_url,
            vote_count,
            position,
            is_active,
            created_at
          )
        `)
        .eq('session_id', targetSessionId);
      
      if (candidatesError) throw candidatesError;
      
      // Extraire et trier les candidats
      const candidatesList = sessionCandidates
        ?.map(item => item.candidates)
        .filter(candidate => candidate && candidate.is_active)
        .sort((a, b) => b.vote_count - a.vote_count) || [];
      
      setCandidates(candidatesList);
      setTotalVotes(candidatesList.reduce((sum, candidate) => sum + candidate.vote_count, 0));
      
      console.log('✅ Résultats récupérés:', candidatesList.length, 'candidats pour session:', sessionData.title);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des résultats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchResults, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPercentage = (votes: number) => {
    return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-orange-500'; // Or
      case 1: return 'from-gray-300 to-gray-500'; // Argent
      case 2: return 'from-orange-600 to-orange-800'; // Bronze
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

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
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center">
                <BarChart3 className="w-12 h-12 mr-4 text-cyan-400" />
                Résultats
              </h1>
              {session && (
                <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
                  {session.title}
                </h2>
              )}
              <p className="text-xl text-slate-400 max-w-2xl">
                {session?.description || 'Résultats transparents et vérifiables de cette session de vote'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-6 md:mt-0">
              <GradientButton
                onClick={fetchResults}
                disabled={refreshing}
                className="px-6 py-3 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </GradientButton>
              
              <button className="p-3 bg-slate-800/50 rounded-xl text-slate-400 hover:text-cyan-400 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              
              <button className="p-3 bg-slate-800/50 rounded-xl text-slate-400 hover:text-cyan-400 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Total des Votes',
              value: totalVotes,
              icon: Users,
              color: 'from-cyan-500 to-blue-500',
              suffix: 'votes'
            },
            {
              title: 'Candidats',
              value: candidates.length,
              icon: Award,
              color: 'from-violet-500 to-purple-500',
              suffix: 'participants'
            },
            {
              title: 'Participation',
              value: totalVotes > 0 ? 100 : 0,
              icon: TrendingUp,
              color: 'from-emerald-500 to-teal-500',
              suffix: '%'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <Eye className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">
                  {stat.title}
                </h3>
                <div className="text-2xl font-bold text-white flex items-baseline space-x-2">
                  <CounterAnimation end={stat.value} duration={2} />
                  <span className="text-sm text-slate-400 font-normal">
                    {stat.suffix}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Graphique des résultats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Distribution des Votes
            </h2>
            <ResultsChart candidates={candidates} />
          </GlassCard>
        </motion.div>

        {/* Classement détaillé */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Award className="w-6 h-6 mr-3 text-yellow-400" />
            Classement Final
          </h2>
          
          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <GlassCard className="p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
                  <div className="flex items-center space-x-6">
                    {/* Rang */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getRankColor(index)} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl font-bold text-white">
                        {getRankIcon(index)}
                      </span>
                    </div>
                    
                    {/* Photo du candidat */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-700">
                      {candidate.image_url ? (
                        <img 
                          src={candidate.image_url} 
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Users className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Informations du candidat */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {candidate.name}
                      </h3>
                      {candidate.party && (
                        <p className="text-slate-400 text-sm mb-2">
                          {candidate.party}
                        </p>
                      )}
                      {candidate.description && (
                        <p className="text-slate-500 text-sm line-clamp-2">
                          {candidate.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Résultats */}
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">
                        <CounterAnimation end={candidate.vote_count} duration={2} />
                      </div>
                      <div className="text-sm text-slate-400 mb-2">
                        {getPercentage(candidate.vote_count)}%
                      </div>
                      
                      {/* Barre de progression */}
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getRankColor(index)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${getPercentage(candidate.vote_count)}%` }}
                          transition={{ duration: 2, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Message de transparence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Transparence Blockchain
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Tous les votes sont enregistrés de manière immuable sur la blockchain, 
              garantissant une transparence totale et une vérification indépendante des résultats.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;