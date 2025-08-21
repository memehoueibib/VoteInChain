import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Shield, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  UserCheck,
  UserX,
  Calendar,
  Play,
  Wallet
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useWallet } from '../../hooks/useWallet';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';
import CandidateCard from './CandidateCard';
import CounterAnimation from '../UI/CounterAnimation';

interface VotingPageProps {
  onNavigate: (view: string) => void;
}

interface Candidate {
  id: string;
  name: string;
  description: string | null;
  party: string | null;
  image_url: string | null;
  vote_count: number;
  position: number | null;
  is_active: boolean;
}

interface VotingSession {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  total_votes: number;
  created_by: string | null;
}

interface Participant {
  id: string;
  full_name: string | null;
  email: string;
  has_voted: boolean;
}

const VotingPage: React.FC<VotingPageProps> = ({ onNavigate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null);
  const [availableSessions, setAvailableSessions] = useState<VotingSession[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userCanVote, setUserCanVote] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showSessionSelector, setShowSessionSelector] = useState(false);

  const { user, profile, supabase } = useSupabase();
  const { address, isConnected, connectWallet } = useWallet();
  const { addToast } = useToast();

  useEffect(() => {
    if (user && profile) {
      loadAvailableSessions();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedSessionId) {
      loadVotingData(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadAvailableSessions = async () => {
    try {
      console.log('🔍 Chargement des sessions disponibles pour:', profile?.id);
      
      if (!profile?.id) return;

      // 1. Sessions où je suis créateur
      const { data: createdSessions, error: createdError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('created_by', profile.id)
        .eq('is_active', true);

      if (createdError) throw createdError;

      // 2. Sessions où je suis participant
      const { data: participantSessions, error: participantError } = await supabase
        .from('session_participants')
        .select(`
          session_id,
          voting_sessions!inner (
            id,
            title,
            description,
            is_active,
            start_date,
            end_date,
            total_votes,
            created_by
          )
        `)
        .eq('participant_id', profile.id);

      if (participantError) throw participantError;

      // Combiner les sessions
      const allSessions = [
        ...(createdSessions || []),
        ...(participantSessions?.map(p => p.voting_sessions).filter(Boolean) || [])
      ];

      // Supprimer les doublons
      const uniqueSessions = allSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      console.log('✅ Sessions disponibles:', uniqueSessions.length);
      setAvailableSessions(uniqueSessions);

      // Auto-sélectionner une session
      const sessionFromStorage = sessionStorage.getItem('selectedVotingSession');
      if (sessionFromStorage && uniqueSessions.find(s => s.id === sessionFromStorage)) {
        setSelectedSessionId(sessionFromStorage);
        setShowSessionSelector(false);
      } else if (uniqueSessions.length === 1) {
        setSelectedSessionId(uniqueSessions[0].id);
        setShowSessionSelector(false);
      } else if (uniqueSessions.length > 1) {
        setShowSessionSelector(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement sessions:', error);
      setLoading(false);
    }
  };

  const loadVotingData = async (sessionId: string) => {
    try {
      setLoading(true);
      console.log('📊 Chargement des données pour session:', sessionId);

      // Charger la session
      const { data: sessionData, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setVotingSession(sessionData);

      // Vérifier les droits
      await checkUserVotingRights(sessionId);

      // Charger les candidats
      await loadSessionCandidates(sessionId);

      // Charger les participants
      await loadSessionParticipants(sessionId);

      setShowSessionSelector(false);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les données de vote'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserVotingRights = async (sessionId: string) => {
    try {
      if (!profile?.id) {
        setUserCanVote(false);
        setUserHasVoted(false);
        return;
      }

      console.log('🔍 Vérification droits pour session:', sessionId);

      // Vérifier si créateur
      const { data: sessionData } = await supabase
        .from('voting_sessions')
        .select('created_by')
        .eq('id', sessionId)
        .single();

      const isCreator = sessionData?.created_by === profile.id;

      // Vérifier si participant
      const { data: participation } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', profile.id);

      const isParticipant = participation && participation.length > 0;

      const canVote = isCreator || isParticipant;
      console.log('✅ Droits:', { isCreator, isParticipant, canVote });
      setUserCanVote(canVote);

      // Vérifier si a voté
      if (canVote) {
        const { data: vote } = await supabase
          .from('votes')
          .select('*')
          .eq('session_id', sessionId)
          .eq('voter_id', profile.id);

        const hasVoted = vote && vote.length > 0;
        setUserHasVoted(hasVoted);
      }
    } catch (error) {
      console.error('❌ Erreur vérification droits:', error);
      setUserCanVote(false);
      setUserHasVoted(false);
    }
  };

  const loadSessionCandidates = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
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
            is_active
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;

      const sessionCandidates = data
        ?.map(item => item.candidates)
        .filter(candidate => candidate && candidate.is_active)
        .sort((a, b) => b.vote_count - a.vote_count) || [];

      setCandidates(sessionCandidates);
    } catch (error) {
      console.error('❌ Erreur chargement candidats:', error);
    }
  };

  const loadSessionParticipants = async (sessionId: string) => {
    try {
      // Récupérer les IDs des participants
      const { data: participantIds, error: participantError } = await supabase
        .from('session_participants')
        .select('participant_id')
        .eq('session_id', sessionId);

      if (participantError) throw participantError;

      if (!participantIds || participantIds.length === 0) {
        setParticipants([]);
        return;
      }

      // Récupérer les profils
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', participantIds.map(p => p.participant_id));

      if (profilesError) throw profilesError;

      // Vérifier qui a voté
      const participantsWithVoteStatus = await Promise.all(
        (profiles || []).map(async (participant) => {
          const { data: vote } = await supabase
            .from('votes')
            .select('id')
            .eq('session_id', sessionId)
            .eq('voter_id', participant.id);

          return {
            ...participant,
            has_voted: vote && vote.length > 0
          };
        })
      );

      setParticipants(participantsWithVoteStatus);
    } catch (error) {
      console.error('❌ Erreur chargement participants:', error);
    }
  };

  const handleVote = async (candidateId: string) => {
    if (!userCanVote || !selectedSessionId) {
      addToast({
        type: 'error',
        title: 'Accès refusé',
        message: 'Vous n\'êtes pas autorisé à voter dans cette session'
      });
      return;
    }

    if (userHasVoted) {
      addToast({
        type: 'error',
        title: 'Déjà voté',
        message: 'Vous avez déjà voté dans cette session'
      });
      return;
    }

    try {
      setIsVoting(true);

      const { error } = await supabase
        .from('votes')
        .insert({
          voter_id: profile?.id,
          candidate_id: candidateId,
          session_id: selectedSessionId,
          wallet_address: address || null
        });

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Vote enregistré !',
        message: 'Votre vote a été enregistré avec succès'
      });

      // Recharger les données
      await loadVotingData(selectedSessionId);

    } catch (error: any) {
      console.error('❌ Erreur vote:', error);
      addToast({
        type: 'error',
        title: 'Erreur de vote',
        message: error.message || 'Impossible d\'enregistrer votre vote'
      });
    } finally {
      setIsVoting(false);
    }
  };

  const selectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    sessionStorage.setItem('selectedVotingSession', sessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-white text-xl">Chargement des sessions de vote...</p>
        </div>
      </div>
    );
  }

  // Aucune session disponible
  if (availableSessions.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-6">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Aucune Session Disponible
          </h2>
          <p className="text-slate-300 mb-6">
            Vous n'êtes participant d'aucune session de vote active.
          </p>
          <GradientButton
            onClick={() => onNavigate('dashboard')}
            className="w-full flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour au Dashboard</span>
          </GradientButton>
        </GlassCard>
      </div>
    );
  }

  // Sélecteur de session
  if (showSessionSelector || !selectedSessionId) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  Choisir une Session de Vote
                </h1>
                <p className="text-slate-400 text-lg">
                  Sélectionnez la session dans laquelle vous souhaitez voter
                </p>
              </div>
              <GradientButton
                onClick={() => onNavigate('dashboard')}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </GradientButton>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
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

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-slate-400">Votes:</span>
                      </div>
                      <span className="text-cyan-400 font-semibold">
                        <CounterAnimation end={session.total_votes} />
                      </span>
                    </div>

                    {session.created_by === profile?.id && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Shield className="w-4 h-4 text-violet-400" />
                        <span className="text-violet-400 font-medium">Vous êtes le créateur</span>
                      </div>
                    )}
                  </div>

                  <GradientButton
                    onClick={() => {
                      console.log('🎯 Sélection de la session:', session.id);
                      selectSession(session.id);
                    }}
                    className="w-full flex items-center justify-center space-x-2"
                    disabled={!session.is_active}
                  >
                    <Play className="w-4 h-4" />
                    <span>Participer au Vote</span>
                  </GradientButton>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Interface de vote normale
  const votedCount = participants.filter(p => p.has_voted).length;
  const notVotedCount = participants.length - votedCount;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                {votingSession?.title}
              </h1>
              <p className="text-slate-400 text-lg">
                {votingSession?.description || 'Participez à cette élection en votant pour votre candidat préféré'}
              </p>
            </div>
            <div className="flex space-x-3">
              {/* Bouton de connexion wallet */}
              {!isConnected ? (
                <GradientButton
                  onClick={connectWallet}
                  className="flex items-center space-x-2"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Connecter Wallet</span>
                </GradientButton>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              )}
              <GradientButton
                onClick={() => setShowSessionSelector(true)}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <Vote className="w-5 h-5" />
                <span>Changer de Session</span>
              </GradientButton>
              <GradientButton
                onClick={() => onNavigate('dashboard')}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </GradientButton>
            </div>
          </div>

          {/* Statistiques de participation */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                <CounterAnimation end={participants.length} />
              </div>
              <div className="text-slate-400 text-sm">Participants</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <UserCheck className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">
                <CounterAnimation end={votedCount} />
              </div>
              <div className="text-slate-400 text-sm">Ont voté</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <UserX className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400">
                <CounterAnimation end={notVotedCount} />
              </div>
              <div className="text-slate-400 text-sm">En attente</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              {userHasVoted ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-400">Voté</div>
                </>
              ) : (
                <>
                  <Vote className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-400">À voter</div>
                </>
              )}
              <div className="text-slate-400 text-sm">Votre statut</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des candidats */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Candidats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CandidateCard
                    candidate={candidate}
                    onVote={handleVote}
                    hasVoted={userHasVoted}
                    isVoting={isVoting}
                    canVote={userCanVote && !userHasVoted && isConnected}
                    walletConnected={isConnected}
                    onConnectWallet={connectWallet}
                  />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Panneau des participants */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Participants</h2>
            <GlassCard className="p-6">
              <div className="space-y-4">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(participant.full_name || participant.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {participant.full_name || 'Nom non défini'}
                        </p>
                        <p className="text-slate-400 text-xs">{participant.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {participant.has_voted ? (
                        <div className="flex items-center space-x-1 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Voté</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">En attente</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {candidates.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Aucun candidat</h3>
              <p className="text-slate-400">
                Aucun candidat n'est disponible pour cette session de vote.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VotingPage;