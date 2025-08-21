import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Download, UserCheck, UserX, Shield, Mail, Calendar } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';

interface Participant {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  wallet_address: string | null;
  has_voted: boolean;
  is_admin: boolean;
  created_at: string;
}

interface ParticipantsListProps {
  onNavigate: (view: string) => void;
}

export default function ParticipantsList({ onNavigate }: ParticipantsListProps) {
  const { supabase, profile } = useSupabase();
  const { addToast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'voted' | 'not_voted' | 'admin'>('all');

  useEffect(() => {
    if (profile?.is_admin) {
      fetchParticipants();
    }
  }, [profile]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger la liste des participants'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (participantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', participantId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Statut mis à jour',
        message: `Statut administrateur ${!currentStatus ? 'accordé' : 'retiré'} avec succès`
      });

      fetchParticipants();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de mettre à jour le statut'
      });
    }
  };

  const exportParticipants = () => {
    const csvContent = [
      ['Nom', 'Email', 'A voté', 'Admin', 'Wallet', 'Date d\'inscription'].join(','),
      ...filteredParticipants.map(p => [
        p.full_name || 'N/A',
        p.email,
        p.has_voted ? 'Oui' : 'Non',
        p.is_admin ? 'Oui' : 'Non',
        p.wallet_address || 'N/A',
        new Date(p.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participants.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Export réussi',
      message: 'La liste des participants a été exportée'
    });
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !searchTerm || 
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (participant.full_name && participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'voted' && participant.has_voted) ||
      (filterStatus === 'not_voted' && !participant.has_voted) ||
      (filterStatus === 'admin' && participant.is_admin);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: participants.length,
    voted: participants.filter(p => p.has_voted).length,
    notVoted: participants.filter(p => !p.has_voted).length,
    admins: participants.filter(p => p.is_admin).length
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
                Liste des Participants
              </h1>
              <p className="text-slate-400 text-lg">
                Gérez les utilisateurs et leurs permissions
              </p>
            </div>
            <GradientButton
              onClick={exportParticipants}
              className="flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Exporter CSV</span>
            </GradientButton>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-slate-400 text-sm">Total</div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 text-center">
              <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">{stats.voted}</div>
              <div className="text-slate-400 text-sm">Ont voté</div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 text-center">
              <UserX className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">{stats.notVoted}</div>
              <div className="text-slate-400 text-sm">N'ont pas voté</div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6 text-center">
              <Shield className="w-8 h-8 text-violet-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">{stats.admins}</div>
              <div className="text-slate-400 text-sm">Administrateurs</div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="pl-12 pr-8 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="voted">Ont voté</option>
                  <option value="not_voted">N'ont pas voté</option>
                  <option value="admin">Administrateurs</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Liste des participants */}
        <div className="space-y-4">
          {filteredParticipants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {participant.full_name ? participant.full_name.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {participant.full_name || 'Nom non défini'}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span>{participant.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Inscrit le {new Date(participant.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        {participant.has_voted ? (
                          <>
                            <UserCheck className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">A voté</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 text-sm font-medium">En attente</span>
                          </>
                        )}
                      </div>
                      {participant.wallet_address && (
                        <div className="text-xs text-slate-400 font-mono">
                          {participant.wallet_address.slice(0, 6)}...{participant.wallet_address.slice(-4)}
                        </div>
                      )}
                    </div>

                    {participant.user_id !== profile?.user_id && (
                      <button
                        onClick={() => toggleAdminStatus(participant.id, participant.is_admin)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          participant.is_admin
                            ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-violet-500/20 hover:text-violet-400'
                        }`}
                      >
                        {participant.is_admin ? (
                          <>
                            <Shield className="w-4 h-4 inline mr-1" />
                            Admin
                          </>
                        ) : (
                          'Promouvoir'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {filteredParticipants.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Aucun participant trouvé</h3>
              <p className="text-slate-400">Aucun participant ne correspond à vos critères de recherche.</p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}