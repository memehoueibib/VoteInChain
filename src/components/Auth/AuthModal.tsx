import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import GlassCard from '../UI/GlassCard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signIn, signUp, supabase } = useSupabase();

  // Générateur de mot de passe sécurisé
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setConfirmPassword(result);
    calculatePasswordStrength(result);
  };

  // Calculer la force du mot de passe
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (/[a-z]/.test(pwd)) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    calculatePasswordStrength(value);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Faible';
    if (passwordStrength <= 3) return 'Moyen';
    if (passwordStrength <= 4) return 'Fort';
    return 'Très fort';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation pour l'inscription
      if (!isLogin) {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setLoading(false);
          return;
        }
      }

      console.log('🔐 Tentative de connexion...', { email, isLogin });
      
      const result = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password, name);

      console.log('📝 Résultat authentification:', result);

      if (result.error) {
        console.error('❌ Erreur auth:', result.error);
        setError(result.error.message);
        setLoading(false);
      } else {
        console.log('✅ Authentification réussie');
        // Le modal se fermera automatiquement via l'effet useEffect qui écoute onAuthStateChange
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'authentification:', error);
      setError(error.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  // Écouter les changements d'état d'authentification pour fermer le modal
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('🎉 Utilisateur connecté, fermeture du modal');
        setLoading(false);
        onClose();
      }
    });

    return () => subscription.unsubscribe();
  }, [onClose]);

  // Reset des états quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={onClose}
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(12px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
          />
          
          <motion.div
            className="relative w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="relative backdrop-blur-xl bg-slate-900/90 border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
              {/* Gradient animé en arrière-plan */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-violet-500/5 to-cyan-500/5 animate-gradient bg-300%" />
              
              <div className="relative p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <motion.div
                      className="flex items-center space-x-2 mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <h2 className="text-2xl font-bold text-white">
                        {isLogin ? 'Bon retour !' : 'Rejoignez-nous'}
                      </h2>
                    </motion.div>
                    <p className="text-slate-400 text-sm">
                      {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte VoteInChain'}
                    </p>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Nom complet"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-slate-800/70 transition-all backdrop-blur-sm"
                        required={!isLogin}
                      />
                    </motion.div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="email"
                      placeholder="Adresse email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-slate-800/70 transition-all backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-slate-800/70 transition-all backdrop-blur-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {/* Générateur de mot de passe */}
                      <motion.button
                        type="button"
                        onClick={generatePassword}
                        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Générer un mot de passe sécurisé
                      </motion.button>

                      {/* Indicateur de force du mot de passe */}
                      {password && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Force du mot de passe:</span>
                            <span className={`font-medium ${
                              passwordStrength <= 2 ? 'text-red-400' :
                              passwordStrength <= 3 ? 'text-yellow-400' :
                              passwordStrength <= 4 ? 'text-blue-400' : 'text-green-400'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-2">
                            <motion.div 
                              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Confirmation du mot de passe */}
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmer le mot de passe"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-slate-800/70 transition-all backdrop-blur-sm"
                          required={!isLogin}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Critères de mot de passe */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { test: password.length >= 8, text: '8+ caractères' },
                          { test: /[A-Z]/.test(password), text: 'Majuscule' },
                          { test: /[a-z]/.test(password), text: 'Minuscule' },
                          { test: /[0-9]/.test(password), text: 'Chiffre' }
                        ].map((criterion, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {criterion.test ? 
                              <Check className="w-3 h-3 text-green-400" /> : 
                              <AlertCircle className="w-3 h-3 text-slate-500" />
                            }
                            <span className={criterion.test ? 'text-green-400' : 'text-slate-500'}>
                              {criterion.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4 backdrop-blur-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <span>Traitement...</span>
                      </div>
                    ) : (
                      isLogin ? 'Se connecter' : 'Créer mon compte'
                    )}
                  </motion.button>
                </form>

                <div className="mt-8 text-center">
                  <motion.button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setPassword('');
                      setConfirmPassword('');
                      setPasswordStrength(0);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLogin ? "Pas encore de compte ? Créer un compte" : 'Déjà un compte ? Se connecter'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;