import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { ethers } from 'ethers';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import GlassCard from '../UI/GlassCard';

interface GasEstimatorProps {
  candidateId?: number;
  operation?: 'vote' | 'addCandidate' | 'toggleVoting';
  onEstimateReady?: (estimate: GasEstimate) => void;
}

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  estimatedCost: string;
  estimatedCostEth: string;
  estimatedCostUsd?: string;
}

const GasEstimator: React.FC<GasEstimatorProps> = ({
  candidateId,
  operation = 'vote',
  onEstimateReady
}) => {
  const { estimateVoteCost } = useContract();
  const { provider } = useWallet();
  const [estimate, setEstimate] = useState<GasEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  // Récupérer le prix de l'ETH
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Erreur lors de la récupération du prix ETH:', error);
      }
    };

    fetchEthPrice();
  }, []);

  // Estimer le gas
  useEffect(() => {
    if (operation === 'vote' && candidateId !== undefined) {
      estimateGas();
    }
  }, [candidateId, operation]);

  const estimateGas = async () => {
    if (!provider || (operation === 'vote' && candidateId === undefined)) return;

    try {
      setLoading(true);

      let gasEstimate: any = null;

      if (operation === 'vote' && candidateId !== undefined) {
        gasEstimate = await estimateVoteCost(candidateId);
      } else {
        // Estimation générique pour d'autres opérations
        const feeData = await provider.getFeeData();
        const defaultGasLimits = {
          vote: 150000,
          addCandidate: 100000,
          toggleVoting: 50000
        };

        const gasLimit = BigInt(defaultGasLimits[operation]);
        const gasPrice = feeData.gasPrice || BigInt(20000000000);
        const estimatedCost = gasLimit * gasPrice;

        gasEstimate = {
          gasEstimate: gasLimit.toString(),
          gasPrice: gasPrice.toString(),
          estimatedCost: estimatedCost.toString(),
          estimatedCostEth: ethers.formatEther(estimatedCost)
        };
      }

      if (gasEstimate) {
        const finalEstimate: GasEstimate = {
          gasLimit: gasEstimate.gasEstimate,
          gasPrice: gasEstimate.gasPrice,
          estimatedCost: gasEstimate.estimatedCost,
          estimatedCostEth: gasEstimate.estimatedCostEth,
          estimatedCostUsd: ethPrice 
            ? (parseFloat(gasEstimate.estimatedCostEth) * ethPrice).toFixed(2)
            : undefined
        };

        setEstimate(finalEstimate);
        onEstimateReady?.(finalEstimate);
      }
    } catch (error) {
      console.error('Erreur lors de l\'estimation du gas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOperationLabel = () => {
    switch (operation) {
      case 'vote':
        return 'Vote';
      case 'addCandidate':
        return 'Ajouter candidat';
      case 'toggleVoting':
        return 'Basculer vote';
      default:
        return 'Opération';
    }
  };

  const getGasPriceLevel = () => {
    if (!estimate) return 'normal';
    
    const gasPriceGwei = parseFloat(ethers.formatUnits(estimate.gasPrice, 'gwei'));
    
    if (gasPriceGwei < 20) return 'low';
    if (gasPriceGwei < 50) return 'normal';
    return 'high';
  };

  const getGasPriceColor = () => {
    const level = getGasPriceLevel();
    switch (level) {
      case 'low':
        return 'text-green-400';
      case 'normal':
        return 'text-yellow-400';
      case 'high':
        return 'text-red-400';
    }
  };

  const getGasPriceLabel = () => {
    const level = getGasPriceLevel();
    switch (level) {
      case 'low':
        return 'Faible';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Élevé';
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full"
          />
          <span className="text-slate-400 text-sm">Estimation du gas...</span>
        </div>
      </GlassCard>
    );
  }

  if (!estimate) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center space-x-3">
          <Fuel className="w-5 h-5 text-slate-400" />
          <span className="text-slate-400 text-sm">Estimation non disponible</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fuel className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Estimation Gas - {getOperationLabel()}</span>
          </div>
          <motion.button
            onClick={estimateGas}
            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Actualiser"
          >
            <TrendingUp className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">Limite Gas</span>
            </div>
            <p className="text-white font-mono text-sm">
              {parseInt(estimate.gasLimit).toLocaleString()}
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-1 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">Prix Gas</span>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-white font-mono text-sm">
                {parseFloat(ethers.formatUnits(estimate.gasPrice, 'gwei')).toFixed(1)} Gwei
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getGasPriceColor()} bg-current bg-opacity-20`}>
                {getGasPriceLabel()}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Coût estimé</span>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">
                {parseFloat(estimate.estimatedCostEth).toFixed(6)} ETH
              </p>
              {estimate.estimatedCostUsd && (
                <p className="text-slate-400 text-xs">
                  ≈ ${estimate.estimatedCostUsd} USD
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          Les frais peuvent varier selon les conditions du réseau
        </div>
      </div>
    </GlassCard>
  );
};

export default GasEstimator;