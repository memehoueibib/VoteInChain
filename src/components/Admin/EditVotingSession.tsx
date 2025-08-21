import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  UserPlus, 
  UserMinus, 
  Search, 
  Users,
  Calendar,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';

interface EditVotingSessionProps {
  sessionId: string;
  onClose: () => void;
  onSessionUpdated: () => void;
}

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_admin: boolean;
}

interface Participant {
  id: string;
  participant_id: string;
  status: string;
  participant_profile: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

interface Candidate {
  id: string;
  candidate_id: string;
  candidate_profile: {
    id: string;
    name: string;
    description: string | null;
    party: string | null;
  };
}

const EditVotingSession: React.FC<EditVotingSessionProps> = ({
  sessionId,
  onClose,
  onSessionUpdated
}) => {
  const { supabase, profile } = useSupabase();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Données de la session
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: false,
    total_votes: 0
  });
  
  // Listes
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<Participant[]>([]);
  const [currentCandidates, setCurrentCandidates] = useState<Candidate[]>([]);

  // Dérivé de sessionData pour vérifier s'il y a des votes
  const hasVotes = sessionData.total_votes > 0;

  useEffect(() => {
    loadSessionData();
    loadAllUsers();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      // Charger les infos de la session
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      setSessionData({
        title: session.title,
        description: session.description || '',
        start_date: session.start_date ? new Date(session.start_date).toISOString().slice(0, 16) : '',
        end_date: session.end_date ? new Date(session.end_date).toISOString().slice(0, 16) : '',
        is_active: session.is_active,
        total_votes: session.total_votes || 0
      });

      // Charger les participants actuels
      const { data: participants, error: participantsError } = await supabase
        .from('session_participants')
        .select(`
          id,
          participant_id,
          status,
          participant_profile:profiles!session_participants_participant_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;
      setCurrentParticipants(participants || []);

      // Charger les candidats actuels
      const { data: candidates, error: candidatesError } = await supabase
        .from('session_candidates')
        .select(`
          id,
          candidate_id,
          candidate_profile:candidates(
            id,
            name,
            description,
            party
          )
        `)
        .eq('session_id', sessionId);

      if (candidatesError) throw candidatesError;
      setCurrentCandidates(candidates || []);

    } catch (error) {
      console.error('Erreur chargement session:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les données de la session'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, is_admin')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      
      // Filtrer l'utilisateur actuel
      const filteredUsers = (data || []).filter(user => user.user_id !== profile?.user_id);
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const addParticipant = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          participant_id: userId,
          invited_by: profile?.id,
          status: 'accepted'
        });

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Participant ajouté',
        message: 'Le participant a été ajouté à la session'
      });

      loadSessionData();
    } catch (error: any) {
      console.error('Erreur ajout participant:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible d\'ajouter le participant'
      });
    }
  };

  const removeParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Participant retiré',
        message: 'Le participant a été retiré de la session'
      });

      loadSessionData();
    } catch (error: any) {
      console.error('Erreur suppression participant:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de retirer le participant'
      });
    }
  };

  const addCandidate = async (userId: string) => {
    try {
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      // Créer le candidat
      const { data: newCandidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          name: user.full_name || user.email,
          description: `Candidat: ${user.full_name || user.email}`,
          candidate_type: 'user',
          user_id: user.id,
          vote_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      // Lier à la session
      const { error: linkError } = await supabase
        .from('session_candidates')
        .insert({
          session_id: sessionId,
          candidate_id: newCandidate.id,
          added_by: profile?.id
        });

      if (linkError) throw linkError;

      addToast({
        type: 'success',
        title: 'Candidat ajouté',
        message: 'Le candidat a été ajouté à la session'
      });

      loadSessionData();
    } catch (error: any) {
      console.error('Erreur ajout candidat:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible d\'ajouter le candidat'
      });
    }
  };

  const removeCandidate = async (sessionCandidateId: string, candidateId: string) => {
    try {
      // Supprimer de la session
      const { error: unlinkError } = await supabase
        .from('session_candidates')
        .delete()
        .eq('id', sessionCandidateId);

      if (unlinkError) throw unlinkError;

      // Supprimer le candidat lui-même
      const { error: deleteError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (deleteError) throw deleteError;

      addToast({
        type: 'success',
        title: 'Candidat retiré',
        message: 'Le candidat a été retiré de la session'
      });

      loadSessionData();
    } catch (error: any) {
      console.error('Erreur suppression candidat:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de retirer le candidat'
      });
    }
  };

  const saveSession = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('voting_sessions')
        .update({
          title: sessionData.title,
          description: sessionData.description || null,
          start_date: sessionData.start_date || null,
          end_date: sessionData.end_date || null,
          is_active: sessionData.is_active
        })
        .eq('id', sessionId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Session mise à jour',
        message: 'Les modifications ont été sauvegardées'
      });

      onSessionUpdated();
      onClose();
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder les modifications'
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const isNotParticipant = !currentParticipants.some(p => p.participant_id === user.id);
    const isNotCandidate = !currentCandidates.some(c => c.candidate_profile.id === user.id);

    return matchesSearch && (isNotParticipant || isNotCandidate);
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Modifier la Session de Vote
              </h2>
              <p className="text-slate-400">
                Modifiez les paramètres et gérez les participants
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations de la session */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                Informations de la Session
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={sessionData.title}
                    onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                    disabled={hasVotes}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={sessionData.description}
                    onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
                    disabled={hasVotes}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-20 resize-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date de début
                    </label>
                    <input
                      type="datetime-local"
                      value={sessionData.start_date}
                      onChange={(e) => setSessionData({ ...sessionData, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="datetime-local"
                      value={sessionData.end_date}
                      onChange={(e) => setSessionData({ ...sessionData, end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={sessionData.is_active}
                    onChange={(e) => setSessionData({ ...sessionData, is_active: e.target.checked })}
                    className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="is_active" className="text-white">
                    Session active
                  </label>
                </div>
              </div>
            </div>

            {/* Gestion des utilisateurs */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-cyan-400" />
                Ajouter des Utilisateurs
              </h3>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher des utilisateurs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.full_name || 'Nom non défini'}
                        </p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addParticipant(user.id)}
                        disabled={hasVotes}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                      >
                        + Participant
                      </button>
                      <button
                        onClick={() => addCandidate(user.id)}
                        disabled={hasVotes}
                        className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors text-sm"
                      >
                        + Candidat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Participants actuels */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Participants Actuels ({currentParticipants.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {participant.participant_profile.full_name || 'Nom non défini'}
                      </p>
                      <p className="text-slate-400 text-sm">{participant.participant_profile.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Candidats actuels */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Candidats Actuels ({currentCandidates.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {candidate.candidate_profile.name}
                      </p>
                      {candidate.candidate_profile.party && (
                        <p className="text-slate-400 text-sm">{candidate.candidate_profile.party}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCandidate(candidate.id, candidate.candidate_id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 mt-8 pt-6 border-t border-slate-700/50">
            <GradientButton
              onClick={saveSession}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Sauvegarder</span>
                </>
              )}
            </GradientButton>

            <GradientButton
              onClick={onClose}
              variant="secondary"
              disabled={saving}
            >
              Annuler
            </GradientButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default EditVotingSession;