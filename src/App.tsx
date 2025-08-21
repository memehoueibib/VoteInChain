import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote } from 'lucide-react';
import { useSupabase } from './hooks/useSupabase';
import { useWallet } from './hooks/useWallet';
import { ToastProvider } from './components/UI/ToastContainer';

// Components
import AnimatedBackground from './components/Background/AnimatedBackground';
import Navbar from './components/Navigation/Navbar';
import Hero from './components/Landing/Hero';
import AuthModal from './components/Auth/AuthModal';
import Dashboard from './components/Dashboard/Dashboard';
import VotingPage from './components/Voting/VotingPage';
import ResultsPage from './components/Results/ResultsPage';
import AdminPanel from './components/Admin/AdminPanel';
import ProfileSettings from './components/Profile/ProfileSettings';
import VotingSessionManager from './components/Admin/VotingSessionManager';
import ParticipantsList from './components/Admin/ParticipantsList';
import CreateVotingSessionPage from './components/Admin/CreateVotingSessionPage';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { user, profile, loading } = useSupabase();
  const { checkConnection } = useWallet();

  // Debug: Log des changements de vue
  useEffect(() => {
    console.log('🔄 Vue actuelle:', currentView);
    console.log('👤 Utilisateur:', user ? '✅ Connecté' : '❌ Non connecté');
    console.log('👑 Admin:', profile?.is_admin ? '✅ Oui' : '❌ Non');
  }, [currentView, user, profile]);

  // Vérifier la connexion wallet au démarrage
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6"
          />
          <motion.p 
            className="text-white text-xl font-semibold"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Chargement de VoteInChain...
          </motion.p>
          {/* Timeout de sécurité */}
          <motion.p 
            className="text-slate-400 text-sm mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5 }}
          >
            Si le chargement prend trop de temps, actualisez la page
          </motion.p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    console.log('🎯 Rendu de la vue:', currentView);
    
    switch (currentView) {
      case 'home':
        console.log('🏠 Affichage de la page d\'accueil');
        return (
          <Hero 
            onGetStarted={() => user ? setCurrentView('dashboard') : setShowAuthModal(true)}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
      
      case 'dashboard':
        console.log('📊 Affichage du dashboard');
        return user ? (
          <Dashboard onNavigate={setCurrentView} />
        ) : (
          <Hero 
            onGetStarted={() => setShowAuthModal(true)} 
            onShowAuth={() => setShowAuthModal(true)} 
          />
        );
      
      case 'create-session':
        console.log('🗳️ Affichage de la création de session');
        if (!user) {
          console.log('❌ Utilisateur non connecté - redirection vers Hero');
          return (
            <Hero 
              onGetStarted={() => setShowAuthModal(true)} 
              onShowAuth={() => setShowAuthModal(true)} 
            />
          );
        }
        if (!profile?.is_admin) {
          console.log('❌ Utilisateur non admin - affichage message d\'erreur');
          return (
            <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
                <div className="text-red-400 mb-4 text-6xl">🚫</div>
                <h2 className="text-2xl font-bold text-white mb-4">Accès Refusé</h2>
                <p className="text-slate-400 mb-6">
                  Vous devez être administrateur pour créer des sessions de vote.
                </p>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl"
                >
                  Retour au Dashboard
                </button>
              </div>
            </div>
          );
        }
        console.log('✅ Affichage de CreateVotingSessionPage');
        return <CreateVotingSessionPage onNavigate={setCurrentView} />;
      
      case 'voting':
        console.log('🗳️ Affichage de la page de vote');
        return user ? (
          <VotingPage onNavigate={setCurrentView} />
        ) : (
          <Hero 
            onGetStarted={() => setShowAuthModal(true)} 
            onShowAuth={() => setShowAuthModal(true)} 
          />
        );
      
      case 'results':
        console.log('📊 Affichage des résultats');
        return <ResultsPage />;
      
      case 'profile':
        console.log('👤 Affichage du profil');
        return user ? (
          <ProfileSettings onNavigate={setCurrentView} />
        ) : (
          <Hero 
            onGetStarted={() => setShowAuthModal(true)} 
            onShowAuth={() => setShowAuthModal(true)} 
          />
        );
      
      case 'admin':
        console.log('👑 Affichage du panneau admin');
        return user && profile?.is_admin ? (
          <AdminPanel />
        ) : (
          <Hero 
            onGetStarted={() => setShowAuthModal(true)} 
            onShowAuth={() => setShowAuthModal(true)} 
          />
        );
      
      case 'participants':
        console.log('👥 Affichage de la liste des participants');
        return user && profile?.is_admin ? (
          <ParticipantsList onNavigate={setCurrentView} />
        ) : (
          <Hero 
            onGetStarted={() => setShowAuthModal(true)} 
            onShowAuth={() => setShowAuthModal(true)} 
          />
        );
      
      case 'voting-sessions':
        console.log('📋 Affichage de la gestion des sessions');
        return user && profile?.is_admin ? (
          <VotingSessionManager onNavigate={setCurrentView} />
        ) : (
          <Hero 
            onGetStarted={() => setShowAuthModal(true)} 
            onShowAuth={() => setShowAuthModal(true)} 
          />
        );
      
      default:
        console.log('❓ Vue inconnue, affichage de Hero');
        return (
          <Hero 
            onGetStarted={() => user ? setCurrentView('dashboard') : setShowAuthModal(true)}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-x-hidden">
        <AnimatedBackground />
        
        <Navbar 
          currentView={currentView} 
          onViewChange={(view) => {
            console.log('🔄 Changement de vue demandé:', view);
            setCurrentView(view);
          }} 
          onShowAuth={() => setShowAuthModal(true)} 
        />
        
        <AnimatePresence mode="wait">
          <motion.main
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.main>
        </AnimatePresence>
        
        {/* Fonction pour définir la session sélectionnée */}
        {React.createElement('script', {
          dangerouslySetInnerHTML: {
            __html: `window.setSelectedSession = function(sessionId) { console.log('Session sélectionnée:', sessionId); }`
          }
        })}
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
        
        {/* Footer moderne */}
        <footer className="relative z-10 border-t border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Logo et description */}
              <div className="md:col-span-2">
                <motion.div 
                  className="flex items-center space-x-3 mb-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Vote className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    VoteInChain
                  </span>
                </motion.div>
                <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                  La plateforme de vote blockchain la plus sécurisée et transparente. 
                  Révolutionnez la démocratie numérique avec la technologie blockchain.
                </p>
                <div className="flex space-x-4">
                  {['twitter', 'github', 'discord'].map((social, index) => (
                    <motion.a 
                      key={social}
                      href="#" 
                      className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-5 h-5 bg-current rounded" />
                    </motion.a>
                  ))}
                </div>
              </div>
              
              {/* Liens rapides */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-lg">Plateforme</h4>
                <ul className="space-y-3">
                  {[
                    { name: 'Tableau de bord', view: 'dashboard' },
                    { name: 'Voter', view: 'voting' },
                    { name: 'Résultats', view: 'results' },
                    { name: 'Sécurité', view: 'home' }
                  ].map((link, index) => (
                    <motion.li 
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button 
                        onClick={() => setCurrentView(link.view)}
                        className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-lg">Support</h4>
                <ul className="space-y-3">
                  {[
                    'Documentation',
                    'Guide d\'utilisation',
                    'FAQ',
                    'Contact'
                  ].map((item, index) => (
                    <motion.li 
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <a 
                        href="#" 
                        className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm"
                      >
                        {item}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="border-t border-slate-800 mt-12 pt-8 text-center">
              <p className="text-slate-500 text-sm">
                © 2024 VoteInChain. Tous droits réservés. Propulsé par la blockchain.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;