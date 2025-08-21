import { ethers } from 'ethers';

// Configuration du contrat
export const CONTRACT_CONFIG = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS || "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e",
  abi: [
    "function vote(uint256 _candidateId) external",
    "function getAllCandidates() external view returns (tuple(uint256 id, string name, uint256 voteCount, bool isActive)[])",
    "function hasUserVoted(address _voter) external view returns (bool)",
    "function getUserVote(address _voter) external view returns (uint256)",
    "function getTotalVotes() external view returns (uint256)",
    "function getResults() external view returns (uint256[], string[], uint256[], uint256)",
    "function getWinner() external view returns (uint256, string, uint256)",
    "function votingActive() external view returns (bool)",
    "function addCandidate(string memory _name) external",
    "function toggleVoting() external",
    "function admin() external view returns (address)",
    "event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp, string candidateName)"
  ]
};

// Estimation du gas pour différentes opérations
export const GAS_ESTIMATES = {
  vote: 150000,
  addCandidate: 100000,
  toggleVoting: 50000
};

// Utilitaires pour les erreurs blockchain
export const parseContractError = (error: any): string => {
  if (error.code === 4001) {
    return "Transaction annulée par l'utilisateur";
  }
  
  if (error.code === -32603) {
    return "Erreur interne du réseau";
  }
  
  if (error.message?.includes("insufficient funds")) {
    return "Fonds insuffisants pour payer les frais de gas";
  }
  
  if (error.message?.includes("already voted")) {
    return "Vous avez déjà voté";
  }
  
  if (error.message?.includes("voting not active")) {
    return "Le vote n'est pas actif";
  }
  
  if (error.message?.includes("invalid candidate")) {
    return "Candidat invalide";
  }
  
  return error.reason || error.message || "Erreur inconnue";
};

// Estimation du gas avec marge de sécurité
export const estimateGasWithBuffer = async (
  contract: ethers.Contract,
  method: string,
  args: any[] = [],
  buffer: number = 1.2
): Promise<bigint> => {
  try {
    const estimated = await contract[method].estimateGas(...args);
    return BigInt(Math.floor(Number(estimated) * buffer));
  } catch (error) {
    console.warn("Impossible d'estimer le gas, utilisation de la valeur par défaut");
    return BigInt(GAS_ESTIMATES[method as keyof typeof GAS_ESTIMATES] || 200000);
  }
};

// Vérification du réseau
export const checkNetwork = async (provider: ethers.BrowserProvider): Promise<boolean> => {
  const network = await provider.getNetwork();
  const expectedChainId = import.meta.env.VITE_CHAIN_ID || "11155111"; // Sepolia par défaut
  
  return network.chainId.toString() === expectedChainId;
};

// Formatage des adresses
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Formatage des montants ETH
export const formatEther = (wei: bigint | string): string => {
  try {
    const ether = ethers.formatEther(wei);
    return parseFloat(ether).toFixed(4);
  } catch {
    return "0.0000";
  }
};

// Attendre la confirmation d'une transaction
export const waitForTransaction = async (
  provider: ethers.BrowserProvider,
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> => {
  try {
    console.log(`⏳ Attente de ${confirmations} confirmation(s) pour ${txHash}`);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    
    if (receipt?.status === 1) {
      console.log("✅ Transaction confirmée");
    } else {
      console.log("❌ Transaction échouée");
    }
    
    return receipt;
  } catch (error) {
    console.error("Erreur lors de l'attente de la transaction:", error);
    return null;
  }
};

// Vérifier si MetaMask est installé et connecté
export const checkMetaMaskConnection = (): {
  isInstalled: boolean;
  isConnected: boolean;
  error?: string;
} => {
  if (typeof window === 'undefined') {
    return { isInstalled: false, isConnected: false, error: "Environnement non supporté" };
  }
  
  if (!window.ethereum) {
    return { 
      isInstalled: false, 
      isConnected: false, 
      error: "MetaMask n'est pas installé" 
    };
  }
  
  if (!window.ethereum.isMetaMask) {
    return { 
      isInstalled: false, 
      isConnected: false, 
      error: "MetaMask n'est pas détecté" 
    };
  }
  
  return { isInstalled: true, isConnected: true };
};

// Obtenir les informations de transaction
export const getTransactionInfo = async (
  provider: ethers.BrowserProvider,
  txHash: string
) => {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    return {
      hash: txHash,
      status: receipt?.status === 1 ? 'success' : 'failed',
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      gasPrice: tx?.gasPrice?.toString(),
      from: tx?.from,
      to: tx?.to,
      value: tx?.value?.toString()
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des infos de transaction:", error);
    return null;
  }
};