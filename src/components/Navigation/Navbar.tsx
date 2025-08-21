import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote, 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  Shield,
  Users,
  Calendar
} from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onShowAuth: () => void;
}

export default function Navbar({ currentView, onViewChange, onShowAuth }: NavbarProps) {
  const { user, profile, signOut } = useSupabase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onViewChange('home');
    setShowUserMenu(false);
  };

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, requireAuth: true },
    { id: 'voting', label: 'Voter', icon: Vote, requireAuth: true },
    { id: 'results', label: 'Résultats', icon: BarChart3 },
  ];

  const adminItems = [
    { id: 'create-session', label: 'Créer un Vote', icon: Vote }, // Accessible à tous maintenant
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'voting-sessions', label: 'Sessions de Vote', icon: Calendar },
  ];

  const userMenuItems = [
    { id: 'profile', label: 'Paramètres', icon: Settings },
    { id: 'voting-sessions', label: 'Mes Sessions', icon: Calendar },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onViewChange('home')}
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
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              VoteInChain
            </span>
          </motion.div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.requireAuth && !user) return null;
              
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-white text-sm font-medium">
                      {profile?.full_name || 'Utilisateur'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {profile?.is_admin ? 'Administrateur' : 'Électeur'}
                    </p>
                  </div>
                </motion.button>

                {/* Menu utilisateur */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-xl shadow-black/20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-700/50">
                        <p className="text-white font-medium">{profile?.full_name}</p>
                        <p className="text-slate-400 text-sm">{profile?.email}</p>
                      </div>
                      
                      <div className="py-2">
                        {userMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <motion.button
                              key={item.id}
                              onClick={() => {
                                onViewChange(item.id);
                                setShowUserMenu(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                              whileHover={{ x: 4 }}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{item.label}</span>
                            </motion.button>
                          );
                        })}
                        
                        <div className="border-t border-slate-700/50 mt-2 pt-2">
                          <motion.button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                            whileHover={{ x: 4 }}
                          >
                            <LogOut className="w-5 h-5" />
                            <span>Déconnexion</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={onShowAuth}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Se connecter
              </motion.button>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-slate-700/50 py-4"
            >
              <div className="space-y-2">
                {navItems.map((item) => {
                  if (item.requireAuth && !user) return null;
                  
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}