import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Save, 
  X,
  ArrowLeft,
  UserPlus,
  Search,
  Check,
  Clock
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';

interface CreateVotingSessionPageProps {
  onNavigate: (view: string) => void;
}

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_admin: boolean;
}

const CreateVotingSessionPage: React.FC<CreateVotingSessionPageProps> = ({ onNavigate }) => {
  const { supabase, profile } = useSupabase();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    session_type: 'public',
    start_immediately: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('🔍 Chargement des utilisateurs...');
      console.log('Profile actuel:', profile);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, is_admin')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      
      // Filtrer l'utilisateur actuel
      const filteredUsers = (data || []).filter(user => user.user_id !== profile?.user_id);
      
      setUsers(filteredUsers);
      console.log('✅ Utilisateurs chargés:', filteredUsers.length);
      console.log('Utilisateurs:', filteredUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger la liste des utilisateurs'
      });
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleCandidate = (userId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Le titre est requis');
      }

      if (selectedCandidates.length === 0) {
        throw new Error('Sélectionnez au moins un candidat');
      }

      if (selectedParticipants.length === 0) {
        throw new Error('Sélectionnez au moins un participant');
      }

      const startDate = formData.start_immediately 
        ? new Date().toISOString()
        : formData.start_date || new Date().toISOString();

      // 1. Créer la session de vote
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .insert([{
          title: formData.title,
          description: formData.description || null,
          start_date: startDate,
          end_date: formData.end_date || null,
          is_active: formData.start_immediately,
          session_type: formData.session_type,
          created_by: profile?.id,
          total_votes: 0
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Ajouter les participants (incluant le créateur)
      const allParticipants = selectedParticipants.filter(id => id !== profile?.id);
      const participantsData = allParticipants.map(participantId => ({
        session_id: session.id,
        participant_id: participantId,
        invited_by: profile?.id,
        status: 'accepted'
      }));

      if (participantsData.length > 0) {
        const { error: participantsError } = await supabase
          .from('session_participants')
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      // 3. Créer les candidats (uniquement des utilisateurs)
      for (const candidateUserId of selectedCandidates) {
        const candidateUser = users.find(u => u.id === candidateUserId);
        if (!candidateUser) continue;

        // Créer le candidat
        const { data: newCandidate, error: candidateError } = await supabase
          .from('candidates')
          .insert([{
            name: candidateUser.full_name || candidateUser.email,
            description: `Candidat: ${candidateUser.full_name || candidateUser.email}`,
            candidate_type: 'user',
            user_id: candidateUser.id,
            vote_count: 0,
            is_active: true
          }])
          .select()
          .single();

        if (candidateError) throw candidateError;

        // Lier à la session
        const { error: linkError } = await supabase
          .from('session_candidates')
          .insert([{
            session_id: session.id,
            candidate_id: newCandidate.id,
            added_by: profile?.id
          }]);

        if (linkError) throw linkError;
      }

      addToast({
        type: 'success',
        title: 'Session créée !',
        message: `"${formData.title}" créée avec ${selectedCandidates.length} candidats et ${selectedParticipants.length + 1} participants`
      });

      onNavigate('dashboard');

    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de créer la session'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Créer Votre Session de Vote
              </h1>
              <p className="text-slate-400 text-lg">
                Organisez une élection démocratique avec vos participants
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration de la session */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Configuration de la Session
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Titre de l'élection *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                      placeholder="Ex: Élection du délégué de classe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-20 resize-none transition-colors"
                      placeholder="Description de l'élection..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Type de session
                    </label>
                    <select
                      value={formData.session_type}
                      onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    >
                      <option value="public">Publique</option>
                      <option value="private">Privée</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="start_immediately"
                      checked={formData.start_immediately}
                      onChange={(e) => setFormData({ ...formData, start_immediately: e.target.checked })}
                      className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="start_immediately" className="text-white">
                      Lancer immédiatement
                    </label>
                  </div>

                  {!formData.start_immediately && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Date de début
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Date de fin (optionnel)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Sélection des participants */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Sélectionner les Participants et Candidats
                </h3>

                <div className="space-y-4">
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

                  <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                    <span>Participants: {selectedParticipants.length}</span>
                    <span>Candidats: {selectedCandidates.length}</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-400">
                          {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                        </p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
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
                          
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => toggleParticipant(user.id)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedParticipants.includes(user.id)
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-slate-700/50 text-slate-400 hover:bg-cyan-500/10'
                              }`}
                            >
                              {selectedParticipants.includes(user.id) ? 'Participant' : 'Ajouter'}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => toggleCandidate(user.id)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedCandidates.includes(user.id)
                                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                  : 'bg-slate-700/50 text-slate-400 hover:bg-violet-500/10'
                              }`}
                            >
                              {selectedCandidates.includes(user.id) ? 'Candidat' : 'Candidat'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex space-x-4 pt-6"
          >
            <GradientButton
              type="submit"
              disabled={loading || selectedParticipants.length === 0 || selectedCandidates.length === 0}
              className="flex items-center space-x-2 px-8 py-4"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>
                    {formData.start_immediately ? 'Créer et Lancer' : 'Créer la Session'}
                  </span>
                </>
              )}
            </GradientButton>

            <GradientButton
              type="button"
              onClick={() => onNavigate('dashboard')}
              variant="secondary"
              disabled={loading}
              className="px-8 py-4"
            >
              Annuler
            </GradientButton>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CreateVotingSessionPage;