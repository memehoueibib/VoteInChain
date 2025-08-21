import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/useWallet';
import { getTransactionInfo } from '../../utils/contractUtils';
import GlassCard from '../UI/GlassCard';

interface TransactionStatusProps {
  txHash: string;
  onComplete?: (success: boolean) => void;
  onClose?: () => void;
}

type TransactionStatus = 'pending' | 'success' | 'failed' | 'not_found';

interface TransactionInfo {
  hash: string;
  status: 'success' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  from?: string;
  to?: string;
  value?: string;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  txHash,
  onComplete,
  onClose
}) => {
  const { provider } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [txInfo, setTxInfo] = useState<TransactionInfo | null>(null);
  const [confirmations, setConfirmations] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!provider || !txHash) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const checkTransaction = async () => {
      try {
        const info = await getTransactionInfo(provider, txHash);
        
        if (info) {
          setTxInfo(info);
          
          if (info.status === 'success') {
            setStatus('success');
            onComplete?.(true);
            clearInterval(intervalId);
          } else if (info.status === 'failed') {
            setStatus('failed');
            onComplete?.(false);
            clearInterval(intervalId);
          }

          // Obtenir le nombre de confirmations
          if (info.blockNumber) {
            const currentBlock = await provider.getBlockNumber();
            const confirmationCount = currentBlock - info.blockNumber + 1;
            setConfirmations(Math.max(0, confirmationCount));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la transaction:', error);
      }
    };

    // Vérifier immédiatement
    checkTransaction();

    // Vérifier toutes les 2 secondes
    intervalId = setInterval(checkTransaction, 2000);

    // Timeout après 5 minutes
    timeoutId = setTimeout(() => {
      if (status === 'pending') {
        setStatus('not_found');
        onComplete?.(false);
      }
      clearInterval(intervalId);
    }, 300000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [provider, txHash, status, onComplete]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const getEtherscanUrl = () => {
    const chainId = import.meta.env.VITE_CHAIN_ID || "11155111";
    const baseUrl = chainId === "1" ? "https://etherscan.io" : "https://sepolia.etherscan.io";
    return `${baseUrl}/tx/${txHash}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'failed':
      case 'not_found':
        return <AlertCircle className="w-8 h-8 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Transaction en cours...';
      case 'success':
        return 'Transaction confirmée !';
      case 'failed':
        return 'Transaction échouée';
      case 'not_found':
        return 'Transaction introuvable';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'failed':
      case 'not_found':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <GlassCard className="w-full max-w-md p-6">
          <div className={`w-full p-6 bg-gradient-to-r ${getStatusColor()} rounded-xl border mb-6`}>
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={status === 'pending' ? { rotate: 360 } : {}}
                transition={status === 'pending' ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
              >
                {getStatusIcon()}
              </motion.div>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">
              {getStatusText()}
            </h3>
            
            {status === 'pending' && (
              <p className="text-slate-300 text-center text-sm">
                Veuillez patienter pendant que votre transaction est traitée...
              </p>
            )}
            
            {confirmations > 0 && (
              <p className="text-cyan-400 text-center text-sm mt-2">
                {confirmations} confirmation{confirmations > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Détails de la transaction */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Hash de transaction
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 bg-slate-800/50 rounded-lg font-mono text-sm text-white break-all">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Copier"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-xs mt-1"
                >
                  Hash copié !
                </motion.p>
              )}
            </div>

            {txInfo && (
              <>
                {txInfo.blockNumber && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Bloc
                    </label>
                    <p className="text-white font-mono text-sm">
                      #{txInfo.blockNumber}
                    </p>
                  </div>
                )}

                {txInfo.gasUsed && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Gas utilisé
                    </label>
                    <p className="text-white font-mono text-sm">
                      {parseInt(txInfo.gasUsed).toLocaleString()}
                    </p>
                  </div>
                )}

                {txInfo.gasPrice && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Prix du gas
                    </label>
                    <p className="text-white font-mono text-sm">
                      {ethers.formatUnits(txInfo.gasPrice, 'gwei')} Gwei
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <motion.a
              href={getEtherscanUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Voir sur Etherscan</span>
            </motion.a>
            
            {onClose && status !== 'pending' && (
              <motion.button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Fermer
              </motion.button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionStatus;