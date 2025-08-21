import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Wallet, Save, ArrowLeft, Edit3, Shield } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useWallet } from '../../hooks/useWallet';
import { useToast } from '../UI/ToastContainer';
import GlassCard from '../UI/GlassCard';
import GradientButton from '../UI/GradientButton';

interface ProfileSettingsProps {
  onNavigate: (view: string) => void;
}

export default function ProfileSettings({ onNavigate }: ProfileSettingsProps) {
  const { user, profile, updateProfile } = useSupabase();
  const { address, isConnected } = useWallet();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    wallet_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile && user) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user.email || '',
        wallet_address: profile.wallet_address || address || ''
      });
    }
  }, [profile, user, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await updateProfile({
        full_name: formData.full_name,
        wallet_address: isConnected ? address : formData.wallet_address
      });

      if (success) {
        addToast({
          type: 'success',
          title: 'Profil mis à jour',
          message: 'Vos informations ont été sauvegardées avec succès'
        });
        setEditing(false);
      } else {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de mettre à jour le profil'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Paramètres du Profil
              </h1>
              <p className="text-slate-400 text-lg">
                Gérez vos informations personnelles et préférences
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations du profil */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">Informations Personnelles</h2>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>{editing ? 'Annuler' : 'Modifier'}</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nom complet */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!editing}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        placeholder="Votre nom complet"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/30 border border-slate-700/30 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      L'email ne peut pas être modifié pour des raisons de sécurité
                    </p>
                  </div>

                  {/* Wallet */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse Wallet
                    </label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        value={isConnected ? address || '' : formData.wallet_address}
                        onChange={(e) => !isConnected && setFormData({ ...formData, wallet_address: e.target.value })}
                        disabled={!editing || isConnected}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono text-sm"
                        placeholder="0x..."
                      />
                    </div>
                    {isConnected && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-xs text-green-400">Wallet connecté automatiquement</p>
                      </div>
                    )}
                  </div>

                  {editing && (
                    <div className="flex space-x-4 pt-4">
                      <GradientButton
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-5 h-5" />
                        <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                      </GradientButton>
                    </div>
                  )}
                </form>
              </GlassCard>
            </motion.div>
          </div>

          {/* Informations du compte */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Statut du Compte</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Type de compte</span>
                    <div className="flex items-center space-x-2">
                      {profile?.is_admin ? (
                        <>
                          <Shield className="w-4 h-4 text-violet-400" />
                          <span className="text-violet-400 font-medium">Administrateur</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400 font-medium">Utilisateur</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {!profile?.is_admin && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium text-sm">Devenir Administrateur</span>
                      </div>
                      <p className="text-slate-400 text-xs">
                        Pour créer des sessions de vote et gérer la plateforme, contactez un administrateur existant.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Statut de vote</span>
                    <span className={`font-medium ${profile?.has_voted ? 'text-green-400' : 'text-yellow-400'}`}>
                      {profile?.has_voted ? 'A voté' : 'En attente'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Wallet</span>
                    <span className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isConnected ? 'Connecté' : 'Déconnecté'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Membre depuis</span>
                    <span className="text-white font-medium">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Sécurité</h3>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Authentification sécurisée</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Données chiffrées</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Blockchain sécurisée</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}