import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, Edit, Trash2, Shield, Users, BarChart3 } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';

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

const AdminPanel: React.FC = () => {
  const { supabase, profile } = useSupabase();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    party: '',
    image_url: ''
  });

  useEffect(() => {
    if (profile?.is_admin) {
      fetchCandidates();
    }
  }, [profile]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des candidats:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les candidats'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('candidates')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          party: formData.party || null,
          image_url: formData.image_url || null,
          vote_count: 0,
          is_active: true
        }]);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Candidat ajouté',
        message: `${formData.name} a été ajouté avec succès`
      });

      setFormData({ name: '', description: '', party: '', image_url: '' });
      setShowAddForm(false);
      fetchCandidates();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du candidat:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le candidat'
      });
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) return;

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Candidat supprimé',
        message: `${name} a été supprimé`
      });

      fetchCandidates();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le candidat'
      });
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 pt-20 pb-16 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Accès refusé</h2>
          <p className="text-slate-400">Vous n'avez pas les permissions d'administrateur.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 pt-20 pb-16 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 pt-20 pb-16">
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
                Panneau d'Administration
              </h1>
              <p className="text-slate-400 text-lg">
                Gérez les candidats et les paramètres de l'élection
              </p>
            </div>
            <motion.button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Ajouter un Candidat
            </motion.button>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Candidats</p>
                  <p className="text-2xl font-bold text-white">{candidates.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Candidats Actifs</p>
                  <p className="text-2xl font-bold text-white">
                    {candidates.filter(c => c.is_active).length}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Votes</p>
                  <p className="text-2xl font-bold text-white">
                    {candidates.reduce((sum, c) => sum + c.vote_count, 0)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-cyan-500" />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <GlassCard className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Ajouter un Nouveau Candidat</h3>
              <form onSubmit={handleAddCandidate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder="Nom du Candidat"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Parti Politique (optionnel)"
                    value={formData.party}
                    onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <textarea
                  placeholder="Description du Candidat"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-24 resize-none transition-colors"
                  required
                />
                <input
                  type="url"
                  placeholder="URL de l'image (optionnel)"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <div className="flex space-x-4">
                  <motion.button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Ajouter le Candidat
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Annuler
                  </motion.button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Liste des candidats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard className="p-6 hover:scale-105 transition-transform duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {candidate.image_url ? (
                      <img
                        src={candidate.image_url}
                        alt={candidate.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{candidate.name}</h3>
                      {candidate.party && (
                        <p className="text-sm text-cyan-400">{candidate.party}</p>
                      )}
                      <p className="text-sm text-slate-400">{candidate.vote_count} votes</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button 
                      className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      whileHover={{ scale: 1.1, rotate: -15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                {candidate.description && (
                  <p className="text-slate-400 text-sm">{candidate.description}</p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {candidates.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-12 text-center">
              <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Aucun candidat</h3>
              <p className="text-slate-400">Commencez par ajouter des candidats à l'élection.</p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;