import React from 'react';
import { motion } from 'framer-motion';
import { Vote, User, CheckCircle, Lock, Wallet } from 'lucide-react';
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

interface CandidateCardProps {
  candidate: Candidate;
  onVote: (candidateId: string) => void;
  hasVoted: boolean;
  isVoting: boolean;
  canVote: boolean;
  walletConnected: boolean;
  onConnectWallet: () => Promise<boolean>;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onVote,
  hasVoted,
  isVoting,
  canVote,
  walletConnected,
  onConnectWallet
}) => {
  const handleVote = () => {
    if (canVote && !hasVoted && !isVoting) {
      onVote(candidate.id);
    }
  };

  return (
    <motion.div
      whileHover={canVote && !hasVoted ? { y: -8, scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6 h-full relative overflow-hidden group">
        {/* Gradient animé au hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-violet-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex flex-col items-center text-center h-full">
          {/* Photo du candidat */}
          <div className="relative mb-6">
            <motion.div
              className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-600/30 group-hover:border-cyan-500/30 transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {candidate.image_url ? (
                <img
                  src={candidate.image_url}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                  <User className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </motion.div>
            
            {/* Badge de votes */}
            <motion.div 
              className="absolute -bottom-2 -right-2 bg-slate-800/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold border border-slate-600/50"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {candidate.vote_count} votes
            </motion.div>
          </div>

          {/* Informations du candidat */}
          <div className="flex-1 mb-6">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
              {candidate.name}
            </h3>
            
            {candidate.party && (
              <p className="text-sm text-cyan-400 mb-3 font-medium">
                {candidate.party}
              </p>
            )}
            
            {candidate.description && (
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                {candidate.description}
              </p>
            )}
          </div>

          {/* Bouton de vote */}
          {!walletConnected ? (
            <motion.button
              onClick={onConnectWallet}
              className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-400 border border-orange-500/30 hover:from-orange-500 hover:to-yellow-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wallet className="w-5 h-5" />
              <span>Connecter Wallet</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={handleVote}
              disabled={!canVote || hasVoted || isVoting}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                hasVoted
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                  : !canVote
                  ? 'bg-slate-700/50 text-slate-500 border border-slate-600/30 cursor-not-allowed'
                  : isVoting
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-cyan-500/30 hover:from-cyan-500 hover:to-violet-500 hover:shadow-lg hover:shadow-cyan-500/25'
              }`}
              whileHover={canVote && !hasVoted && !isVoting ? { scale: 1.02, y: -2 } : {}}
              whileTap={canVote && !hasVoted && !isVoting ? { scale: 0.98 } : {}}
            >
              {hasVoted ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Vote enregistré</span>
                </>
              ) : !canVote ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Non autorisé</span>
                </>
              ) : isVoting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full"
                  />
                  <span>Vote en cours...</span>
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  <span>Voter</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default CandidateCard;