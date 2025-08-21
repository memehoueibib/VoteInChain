import React from 'react';
import { motion } from 'framer-motion';
import { Vote, Shield, Users, Zap, ArrowRight, Sparkles } from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import { useSupabase } from '../../hooks/useSupabase';

interface HeroProps {
  onGetStarted: () => void;
  onShowAuth: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted, onShowAuth }) => {
  const { user } = useSupabase();

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Particules flottantes */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-full mb-8"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium">
            Nouvelle génération de vote blockchain
          </span>
        </motion.div>

        {/* Titre principal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent bg-300% animate-gradient">
              VoteInChain
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Révolutionnez la démocratie numérique avec notre plateforme de vote blockchain 
            ultra-sécurisée, transparente et immuable.
          </p>
        </motion.div>

        {/* Boutons d'action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
        >
          <motion.button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-2xl shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Commencer à voter</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          {!user && (
            <motion.button
              onClick={onShowAuth}
              className="px-8 py-4 border-2 border-cyan-500/50 text-cyan-400 font-semibold rounded-2xl hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Se connecter
            </motion.button>
          )}
        </motion.div>

        {/* Grille de fonctionnalités */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {[
            {
              icon: Shield,
              title: 'Ultra Sécurisé',
              description: 'Cryptage de niveau militaire et protection blockchain avancée',
              color: 'from-green-500 to-emerald-500',
              delay: 0
            },
            {
              icon: Users,
              title: 'Totalement Transparent',
              description: 'Tous les votes sont vérifiables publiquement en temps réel',
              color: 'from-blue-500 to-cyan-500',
              delay: 0.1
            },
            {
              icon: Zap,
              title: 'Résultats Instantanés',
              description: 'Comptage automatique et résultats disponibles immédiatement',
              color: 'from-yellow-500 to-orange-500',
              delay: 0.2
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay, duration: 0.6 }}
            >
              <GlassCard className="p-8 text-center h-full hover:scale-105 transition-transform duration-300">
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: '10', label: 'Candidats', suffix: '' },
            { number: '100', label: 'Sécurisé', suffix: '%' },
            { number: '0', label: 'Frais cachés', suffix: '€' },
            { number: '24', label: 'Support', suffix: '/7' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
            >
              <motion.div
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {stat.number}{stat.suffix}
              </motion.div>
              <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to action final */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20"
        >
          {/* Avertissement de configuration */}
          {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl max-w-2xl mx-auto"
            >
              <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold">Configuration requise</span>
              </div>
              <p className="text-sm text-yellow-300">
                Configurez vos variables d'environnement Supabase dans le fichier .env pour utiliser l'application.
              </p>
            </motion.div>
          )}
          
          <p className="text-slate-400 text-lg mb-6">
            Rejoignez la révolution du vote numérique
          </p>
          <motion.div
            className="flex items-center justify-center space-x-2 text-cyan-400"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Vote className="w-5 h-5" />
            <span className="text-sm font-medium">Scroll pour découvrir</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;