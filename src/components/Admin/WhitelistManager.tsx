import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  Upload, 
  Download,
  CheckCircle,
  XCircle,
  Shield,
  Wallet
} from 'lucide-react';
import { useContract } from '../../hooks/useContract';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';

interface WhitelistManagerProps {
  onNavigate: (view: string) => void;
}

const WhitelistManager: React.FC<WhitelistManagerProps> = ({ onNavigate }) => {
  const { addToWhitelist, addMultipleToWhitelist, loading: contractLoading } = useContract();
  const { supabase, profile } = useSupabase();
  const { addToast } = useToast();
  
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchWhitelistedAddresses();
    }
  }, [profile]);

  const fetchWhitelistedAddresses = async () => {
    try {
      setLoading(true);
      // Récupérer les adresses depuis Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address')
        .not('wallet_address', 'is', null);
      
      if (error) throw error;
      
      const addresses = data
        .map(profile => profile.wallet_address)
        .filter(address => address) as string[];
      
      setWhitelistedAddresses(addresses);
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les adresses whitelistées'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleAddress = async () => {
    if (!newAddress.trim()) return;

    try {
      await addToWhitelist(newAddress.trim());
      setNewAddress('');
      fetchWhitelistedAddresses();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const handleAddBulkAddresses = async () => {
    if (!bulkAddresses.trim()) return;

    const addresses = bulkAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && addr.startsWith('0x'));

    if (addresses.length === 0) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Aucune adresse valide trouvée'
      });
      return;
    }

    try {
      await addMultipleToWhitelist(addresses);
      setBulkAddresses('');
      fetchWhitelistedAddresses();
    } catch (error) {
      console.error('Erreur lors de l\'ajout en masse:', error);
    }
  };

  const exportAddresses = () => {
    const csvContent = [
      'Adresse Wallet',
      ...whitelistedAddresses
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist-addresses.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Export réussi',
      message: 'La liste des adresses a été exportée'
    });
  };

  const filteredAddresses = whitelistedAddresses.filter(address =>
    address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
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
                Gestion de la Whitelist
              </h1>
              <p className="text-slate-400 text-lg">
                Gérez les adresses autorisées à voter
              </p>
            </div>
            <div className="flex space-x-3">
              <GradientButton
                onClick={exportAddresses}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Exporter</span>
              </GradientButton>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6 text-center">
              <Users className="w-8 h-8 text-cyan-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">{whitelistedAddresses.length}</div>
              <div className="text-slate-400 text-sm">Adresses Whitelistées</div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">{filteredAddresses.length}</div>
              <div className="text-slate-400 text-sm">Résultats Filtrés</div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 text-center">
              <Wallet className="w-8 h-8 text-violet-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">ETH</div>
              <div className="text-slate-400 text-sm">Réseau Ethereum</div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Formulaires d'ajout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ajout simple */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-cyan-400" />
                Ajouter une Adresse
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="0x..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-mono text-sm transition-colors"
                />
                <GradientButton
                  onClick={handleAddSingleAddress}
                  disabled={!newAddress.trim() || contractLoading}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter à la Whitelist</span>
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Ajout en masse */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-violet-400" />
                Ajout en Masse
              </h3>
              <div className="space-y-4">
                <textarea
                  placeholder="0x123...&#10;0x456...&#10;0x789..."
                  value={bulkAddresses}
                  onChange={(e) => setBulkAddresses(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-24 resize-none font-mono text-sm transition-colors"
                />
                <GradientButton
                  onClick={handleAddBulkAddresses}
                  disabled={!bulkAddresses.trim() || contractLoading}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Ajouter Toutes les Adresses</span>
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Liste des adresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Adresses Whitelistées ({filteredAddresses.length})
            </h3>
            
            {filteredAddresses.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Aucune adresse</h4>
                <p className="text-slate-400">
                  {searchTerm ? 'Aucune adresse ne correspond à votre recherche' : 'Commencez par ajouter des adresses à la whitelist'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAddresses.map((address, index) => (
                  <motion.div
                    key={address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-mono text-sm">{address}</p>
                        <p className="text-slate-400 text-xs">Adresse Ethereum</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                        Autorisé
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default WhitelistManager;