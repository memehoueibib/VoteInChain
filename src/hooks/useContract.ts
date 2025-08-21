import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { useToast } from '../components/UI/ToastContainer';

// Configuration du contrat mis à jour
const CONTRACT_CONFIG = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS || "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e",
  abi: [
    // Events
    "event VoteCast(address indexed voter, uint256 indexed sessionId, uint256 indexed candidateId, uint256 timestamp, string candidateName, bytes32 voteHash)",
    "event CandidateAdded(uint256 indexed candidateId, string name, string description, string party)",
    "event VotingSessionCreated(uint256 indexed sessionId, string title, uint256 startTime, uint256 endTime, uint256[] candidateIds)",
    "event VotingSessionToggled(uint256 indexed sessionId, bool isActive, uint256 timestamp)",
    "event VoterWhitelisted(address indexed voter, uint256 timestamp, address indexed admin)",
    "event VoterRemovedFromWhitelist(address indexed voter, uint256 timestamp, address indexed admin)",
    
    // Fonctions principales
    "function vote(uint256 _sessionId, uint256 _candidateId) external",
    "function addCandidate(string memory _name, string memory _description, string memory _party, string memory _imageUrl) external",
    "function createVotingSession(string memory _title, string memory _description, uint256 _startTime, uint256 _endTime, uint256[] memory _candidateIds) external",
    
    // Gestion whitelist
    "function addToWhitelist(address _voter) external",
    "function addMultipleToWhitelist(address[] memory _voters) external",
    "function removeFromWhitelist(address _voter) external",
    "function isWhitelisted(address _voter) external view returns (bool)",
    "function getWhitelistedVoters() external view returns (address[] memory)",
    
    // Gestion sessions
    "function toggleVotingSession(uint256 _sessionId) external",
    "function getVotingSession(uint256 _sessionId) external view returns (uint256, string memory, string memory, uint256, uint256, bool, uint256, uint256[] memory)",
    "function getActiveSessions() external view returns (uint256[] memory)",
    "function hasUserVotedInSession(address _voter, uint256 _sessionId) external view returns (bool)",
    "function getUserVoteInSession(address _voter, uint256 _sessionId) external view returns (uint256)",
    
    // Candidats
    "function getAllCandidates() external view returns (tuple(uint256 id, string name, string description, string party, string imageUrl, uint256 voteCount, bool isActive)[] memory)",
    "function getSessionCandidates(uint256 _sessionId) external view returns (tuple(uint256 id, string name, string description, string party, string imageUrl, uint256 voteCount, bool isActive)[] memory)",
    "function getSessionResults(uint256 _sessionId) external view returns (uint256[] memory, string[] memory, uint256[] memory, uint256)",
    
    // Informations générales
    "function admin() external view returns (address)",
    "function candidateCount() external view returns (uint256)",
    "function sessionCount() external view returns (uint256)",
    "function getGeneralStats() external view returns (uint256, uint256, uint256, uint256)"
  ]
};

export const useContract = () => {
  const { address, isConnected } = useWallet();
  const { addToast } = useToast();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le contrat
  useEffect(() => {
    const initContract = async () => {
      if (typeof window !== 'undefined' && window.ethereum && isConnected) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contractInstance = new ethers.Contract(
            CONTRACT_CONFIG.address,
            CONTRACT_CONFIG.abi,
            provider
          );
          setContract(contractInstance);
          setError(null);
          console.log('✅ Contrat initialisé:', CONTRACT_CONFIG.address);
        } catch (err) {
          console.error('❌ Erreur initialisation contrat:', err);
          setError('Impossible d\'initialiser le contrat');
          setContract(null);
        }
      } else {
        setContract(null);
      }
    };

    initContract();
  }, [isConnected]);

  // Fonction utilitaire pour gérer les erreurs
  const handleContractError = (error: any): string => {
    console.error('Erreur contrat:', error);
    
    if (error.code === 4001) {
      return "Transaction annulée par l'utilisateur";
    }
    
    if (error.message?.includes("Vous avez deja vote")) {
      return "Vous avez déjà voté dans cette session";
    }
    
    if (error.message?.includes("Vous n'etes pas autorise")) {
      return "Vous n'êtes pas autorisé à voter";
    }
    
    if (error.message?.includes("Session inactive")) {
      return "La session de vote n'est pas active";
    }
    
    if (error.message?.includes("insufficient funds")) {
      return "Fonds insuffisants pour payer les frais de gas";
    }
    
    return error.reason || error.message || "Erreur inconnue";
  };

  // Voter pour un candidat
  const vote = useCallback(async (sessionId: number, candidateId: number) => {
    if (!contract || !address) {
      throw new Error('Contrat ou wallet non disponible');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🗳️ Vote en cours...', { sessionId, candidateId, voter: address });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      // Vérifier si l'utilisateur est whitelisté
      const isWhitelisted = await contractWithSigner.isWhitelisted(address);
      if (!isWhitelisted) {
        throw new Error("Vous n'êtes pas autorisé à voter");
      }

      // Vérifier si l'utilisateur a déjà voté
      const hasVoted = await contractWithSigner.hasUserVotedInSession(address, sessionId);
      if (hasVoted) {
        throw new Error("Vous avez déjà voté dans cette session");
      }

      // Estimer le gas
      const gasEstimate = await contractWithSigner.vote.estimateGas(sessionId, candidateId);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // +20% de marge

      // Exécuter la transaction
      const tx = await contractWithSigner.vote(sessionId, candidateId, {
        gasLimit: gasLimit
      });

      console.log('📝 Transaction envoyée:', tx.hash);
      
      addToast({
        type: 'info',
        title: 'Transaction envoyée',
        message: 'Votre vote est en cours de traitement...'
      });

      // Attendre la confirmation
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction échouée');
      }

      console.log('✅ Vote confirmé:', receipt);

      addToast({
        type: 'success',
        title: 'Vote enregistré !',
        message: 'Votre vote a été enregistré sur la blockchain'
      });

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString()
      };

    } catch (err: any) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      
      addToast({
        type: 'error',
        title: 'Erreur de vote',
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contract, address, addToast]);

  // Ajouter un électeur à la whitelist
  const addToWhitelist = useCallback(async (voterAddress: string) => {
    if (!contract || !address) {
      throw new Error('Contrat ou wallet non disponible');
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.addToWhitelist(voterAddress);
      await tx.wait();

      addToast({
        type: 'success',
        title: 'Électeur ajouté',
        message: 'L\'électeur a été ajouté à la whitelist'
      });

      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      const errorMessage = handleContractError(err);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contract, address, addToast]);

  // Ajouter plusieurs électeurs à la whitelist
  const addMultipleToWhitelist = useCallback(async (voterAddresses: string[]) => {
    if (!contract || !address) {
      throw new Error('Contrat ou wallet non disponible');
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.addMultipleToWhitelist(voterAddresses);
      await tx.wait();

      addToast({
        type: 'success',
        title: 'Électeurs ajoutés',
        message: `${voterAddresses.length} électeurs ajoutés à la whitelist`
      });

      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      const errorMessage = handleContractError(err);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contract, address, addToast]);

  // Créer une session de vote
  const createVotingSession = useCallback(async (
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    candidateIds: number[]
  ) => {
    if (!contract || !address) {
      throw new Error('Contrat ou wallet non disponible');
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.createVotingSession(
        title,
        description,
        startTime,
        endTime,
        candidateIds
      );
      
      await tx.wait();

      addToast({
        type: 'success',
        title: 'Session créée',
        message: 'La session de vote a été créée sur la blockchain'
      });

      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      const errorMessage = handleContractError(err);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contract, address, addToast]);

  // Obtenir les candidats d'une session
  const getSessionCandidates = useCallback(async (sessionId: number) => {
    if (!contract) return [];

    try {
      const candidates = await contract.getSessionCandidates(sessionId);
      return candidates.map((candidate: any) => ({
        id: Number(candidate.id),
        name: candidate.name,
        description: candidate.description,
        party: candidate.party,
        imageUrl: candidate.imageUrl,
        voteCount: Number(candidate.voteCount),
        isActive: candidate.isActive
      }));
    } catch (err) {
      console.error('Erreur lors de la récupération des candidats:', err);
      return [];
    }
  }, [contract]);

  // Vérifier si l'utilisateur a voté
  const hasUserVotedInSession = useCallback(async (sessionId: number) => {
    if (!contract || !address) return false;

    try {
      return await contract.hasUserVotedInSession(address, sessionId);
    } catch (err) {
      console.error('Erreur lors de la vérification du vote:', err);
      return false;
    }
  }, [contract, address]);

  // Vérifier si l'utilisateur est whitelisté
  const isUserWhitelisted = useCallback(async () => {
    if (!contract || !address) return false;

    try {
      return await contract.isWhitelisted(address);
    } catch (err) {
      console.error('Erreur lors de la vérification de la whitelist:', err);
      return false;
    }
  }, [contract, address]);

  // Obtenir les sessions actives
  const getActiveSessions = useCallback(async () => {
    if (!contract) return [];

    try {
      const sessionIds = await contract.getActiveSessions();
      const sessions = [];

      for (const sessionId of sessionIds) {
        try {
          const sessionData = await contract.getVotingSession(Number(sessionId));
          sessions.push({
            id: Number(sessionData[0]),
            title: sessionData[1],
            description: sessionData[2],
            startTime: Number(sessionData[3]),
            endTime: Number(sessionData[4]),
            isActive: sessionData[5],
            totalVotes: Number(sessionData[6]),
            candidateIds: sessionData[7].map((id: any) => Number(id))
          });
        } catch (err) {
          console.error(`Erreur session ${sessionId}:`, err);
        }
      }

      return sessions;
    } catch (err) {
      console.error('Erreur lors de la récupération des sessions:', err);
      return [];
    }
  }, [contract]);

  // Obtenir les résultats d'une session
  const getSessionResults = useCallback(async (sessionId: number) => {
    if (!contract) return null;

    try {
      const [candidateIds, names, voteCounts, totalVotes] = await contract.getSessionResults(sessionId);
      
      return {
        candidates: candidateIds.map((id: any, index: number) => ({
          id: Number(id),
          name: names[index],
          voteCount: Number(voteCounts[index])
        })),
        totalVotes: Number(totalVotes)
      };
    } catch (err) {
      console.error('Erreur lors de la récupération des résultats:', err);
      return null;
    }
  }, [contract]);

  return {
    contract,
    vote,
    addToWhitelist,
    addMultipleToWhitelist,
    createVotingSession,
    getSessionCandidates,
    hasUserVotedInSession,
    isUserWhitelisted,
    getActiveSessions,
    getSessionResults,
    loading,
    error,
    isConnected: isConnected && !!contract
  };
};