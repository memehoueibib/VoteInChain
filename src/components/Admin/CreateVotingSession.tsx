import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, FileText, Clock, Save, X } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';

interface CreateVotingSessionProps {
  onSessionCreated: () => void;
  onClose: () => void;
}

const CreateVotingSession: React.FC<CreateVotingSessionProps> = ({
  onSessionCreated,
  onClose
}) => {
  const { supabase } = useSupabase();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    candidates: [
      { name: '', description: '', party: '', image_url: '' }
    ]
  });

  const addCandidate = () => {
    setFormData({
      ...formData,
      candidates: [
        ...formData.candidates,
        { name: '', description: '', party: '', image_url: '' }
      ]
    });
  };

  const removeCandidate = (index: number) => {
    if (formData.candidates.length > 1) {
      setFormData({
        ...formData,
        candidates: formData.candidates.filter((_, i) => i !== index)
      });
    }
  };

  const updateCandidate = (index: number, field: string, value: string) => {
    const updatedCandidates = formData.candidates.map((candidate, i) => 
      i === index ? { ...candidate, [field]: value } : candidate
    );
    setFormData({ ...formData, candidates: updatedCandidates });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Le titre est requis');
      }

      if (formData.candidates.some(c => !c.name.trim())) {
        throw new Error('Tous les candidats doivent avoir un nom');
      }

      // 1. Créer la session de vote
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .insert([{
          title: formData.title,
          description: formData.description || null,
          start_date: formData.start_date || new Date().toISOString(),
          end_date: formData.end_date || null,
          is_active: true,
          total_votes: 0
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Créer les candidats
      const candidatesData = formData.candidates.map((candidate, index) => ({
        name: candidate.name,
        description: candidate.description || null,
        party: candidate.party || null,
        image_url: candidate.image_url || null,
        vote_count: 0,
        position: index + 1,
        is_active: true
      }));

      const { error: candidatesError } = await supabase
        .from('candidates')
        .insert(candidatesData);

      if (candidatesError) throw candidatesError;

      addToast({
        type: 'success',
        title: 'Session créée !',
        message: `La session "${formData.title}" a été créée avec ${formData.candidates.length} candidats`
      });

      onSessionCreated();
      onClose();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Créer une Nouvelle Session de Vote
              </h2>
              <p className="text-slate-400">
                Configurez une nouvelle élection avec ses candidats
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations de la session */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                Informations de la Session
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Titre de l'élection *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Ex: Élection Présidentielle 2024"
                    required
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-24 resize-none transition-colors"
                    placeholder="Description de l'élection..."
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
            </div>

            {/* Candidats */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-cyan-400" />
                  Candidats ({formData.candidates.length})
                </h3>
                <GradientButton
                  type="button"
                  onClick={addCandidate}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </GradientButton>
              </div>

              <div className="space-y-4">
                {formData.candidates.map((candidate, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-white">
                        Candidat {index + 1}
                      </h4>
                      {formData.candidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCandidate(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Nom *
                        </label>
                        <input
                          type="text"
                          value={candidate.name}
                          onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                          placeholder="Nom du candidat"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Parti politique
                        </label>
                        <input
                          type="text"
                          value={candidate.party}
                          onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                          placeholder="Parti ou mouvement"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={candidate.description}
                          onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-20 resize-none transition-colors"
                          placeholder="Programme et présentation du candidat"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          URL de l'image
                        </label>
                        <input
                          type="url"
                          value={candidate.image_url}
                          onChange={(e) => updateCandidate(index, 'image_url', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-6 border-t border-slate-700/50">
              <GradientButton
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
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
                    <span>Créer la Session</span>
                  </>
                )}
              </GradientButton>

              <GradientButton
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={loading}
              >
                Annuler
              </GradientButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default CreateVotingSession;