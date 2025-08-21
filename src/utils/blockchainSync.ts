import { ethers } from 'ethers';
import { supabase } from '../lib/supabase';

// Configuration pour la synchronisation blockchain
const SYNC_CONFIG = {
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e",
  rpcUrl: import.meta.env.VITE_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  startBlock: parseInt(import.meta.env.VITE_START_BLOCK || "0"),
  batchSize: 1000
};

// ABI pour les événements
const CONTRACT_ABI = [
  "event VoteCast(address indexed voter, uint256 indexed sessionId, uint256 indexed candidateId, uint256 timestamp, string candidateName, bytes32 voteHash)",
  "event CandidateAdded(uint256 indexed candidateId, string name, string description, string party)",
  "event VotingSessionCreated(uint256 indexed sessionId, string title, uint256 startTime, uint256 endTime, uint256[] candidateIds)",
  "event VoterWhitelisted(address indexed voter, uint256 timestamp, address indexed admin)"
];

class BlockchainSyncService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private isRunning: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(SYNC_CONFIG.rpcUrl);
    this.contract = new ethers.Contract(
      SYNC_CONFIG.contractAddress,
      CONTRACT_ABI,
      this.provider
    );
  }

  /**
   * Démarrer la synchronisation des événements blockchain
   */
  async startSync() {
    if (this.isRunning) {
      console.log('🔄 Synchronisation déjà en cours');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Démarrage de la synchronisation blockchain');

    try {
      // Synchroniser les événements historiques
      await this.syncHistoricalEvents();

      // Écouter les nouveaux événements
      this.listenToNewEvents();

      console.log('✅ Synchronisation blockchain démarrée');
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de la sync:', error);
      this.isRunning = false;
    }
  }

  /**
   * Arrêter la synchronisation
   */
  stopSync() {
    this.isRunning = false;
    this.contract.removeAllListeners();
    console.log('🛑 Synchronisation blockchain arrêtée');
  }

  /**
   * Synchroniser les événements historiques
   */
  private async syncHistoricalEvents() {
    try {
      console.log('📚 Synchronisation des événements historiques...');

      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = SYNC_CONFIG.startBlock;

      // Synchroniser par batches pour éviter les timeouts
      for (let startBlock = fromBlock; startBlock < currentBlock; startBlock += SYNC_CONFIG.batchSize) {
        const endBlock = Math.min(startBlock + SYNC_CONFIG.batchSize - 1, currentBlock);
        
        console.log(`🔍 Synchronisation blocs ${startBlock} à ${endBlock}`);
        
        await this.syncBlockRange(startBlock, endBlock);
      }

      console.log('✅ Événements historiques synchronisés');
    } catch (error) {
      console.error('❌ Erreur sync historique:', error);
    }
  }

  /**
   * Synchroniser une plage de blocs
   */
  private async syncBlockRange(fromBlock: number, toBlock: number) {
    try {
      // Récupérer tous les événements VoteCast
      const voteEvents = await this.contract.queryFilter(
        this.contract.filters.VoteCast(),
        fromBlock,
        toBlock
      );

      for (const event of voteEvents) {
        await this.processVoteEvent(event);
      }

      // Récupérer les événements CandidateAdded
      const candidateEvents = await this.contract.queryFilter(
        this.contract.filters.CandidateAdded(),
        fromBlock,
        toBlock
      );

      for (const event of candidateEvents) {
        await this.processCandidateEvent(event);
      }

      // Récupérer les événements VotingSessionCreated
      const sessionEvents = await this.contract.queryFilter(
        this.contract.filters.VotingSessionCreated(),
        fromBlock,
        toBlock
      );

      for (const event of sessionEvents) {
        await this.processSessionEvent(event);
      }

    } catch (error) {
      console.error(`❌ Erreur sync blocs ${fromBlock}-${toBlock}:`, error);
    }
  }

  /**
   * Écouter les nouveaux événements en temps réel
   */
  private listenToNewEvents() {
    console.log('👂 Écoute des nouveaux événements...');

    // Écouter les votes
    this.contract.on('VoteCast', async (voter, sessionId, candidateId, timestamp, candidateName, voteHash, event) => {
      console.log('🗳️ Nouveau vote détecté:', { voter, sessionId: sessionId.toString(), candidateId: candidateId.toString() });
      await this.processVoteEvent(event);
    });

    // Écouter les nouveaux candidats
    this.contract.on('CandidateAdded', async (candidateId, name, description, party, event) => {
      console.log('👤 Nouveau candidat détecté:', { candidateId: candidateId.toString(), name });
      await this.processCandidateEvent(event);
    });

    // Écouter les nouvelles sessions
    this.contract.on('VotingSessionCreated', async (sessionId, title, startTime, endTime, candidateIds, event) => {
      console.log('📊 Nouvelle session détectée:', { sessionId: sessionId.toString(), title });
      await this.processSessionEvent(event);
    });
  }

  /**
   * Traiter un événement de vote
   */
  private async processVoteEvent(event: any) {
    try {
      const { voter, sessionId, candidateId, timestamp, candidateName, voteHash } = event.args;
      const block = await event.getBlock();

      // Vérifier si le vote existe déjà
      const { data: existingVote } = await supabase
        .from('blockchain_votes')
        .select('id')
        .eq('transaction_hash', event.transactionHash)
        .single();

      if (existingVote) {
        console.log('🔄 Vote déjà synchronisé:', event.transactionHash);
        return;
      }

      // Insérer le vote dans la base de données
      const { error } = await supabase
        .from('blockchain_votes')
        .insert({
          voter_address: voter,
          session_id: sessionId.toString(),
          candidate_id: candidateId.toString(),
          candidate_name: candidateName,
          vote_hash: voteHash,
          transaction_hash: event.transactionHash,
          block_number: event.blockNumber,
          block_timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          gas_used: event.gasUsed?.toString(),
          gas_price: event.gasPrice?.toString()
        });

      if (error) {
        console.error('❌ Erreur insertion vote:', error);
        return;
      }

      // Mettre à jour le compteur de votes du candidat
      await this.updateCandidateVoteCount(candidateId.toString());

      // Mettre à jour le profil utilisateur
      await this.updateUserVoteStatus(voter, sessionId.toString());

      console.log('✅ Vote synchronisé:', event.transactionHash);
    } catch (error) {
      console.error('❌ Erreur traitement vote:', error);
    }
  }

  /**
   * Traiter un événement de candidat
   */
  private async processCandidateEvent(event: any) {
    try {
      const { candidateId, name, description, party } = event.args;

      // Vérifier si le candidat existe déjà
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('blockchain_id', candidateId.toString())
        .single();

      if (existingCandidate) {
        console.log('🔄 Candidat déjà synchronisé:', candidateId.toString());
        return;
      }

      // Insérer le candidat
      const { error } = await supabase
        .from('candidates')
        .insert({
          blockchain_id: candidateId.toString(),
          name,
          description: description || null,
          party: party || null,
          vote_count: 0,
          is_active: true,
          created_from_blockchain: true
        });

      if (error) {
        console.error('❌ Erreur insertion candidat:', error);
        return;
      }

      console.log('✅ Candidat synchronisé:', name);
    } catch (error) {
      console.error('❌ Erreur traitement candidat:', error);
    }
  }

  /**
   * Traiter un événement de session
   */
  private async processSessionEvent(event: any) {
    try {
      const { sessionId, title, startTime, endTime, candidateIds } = event.args;

      // Vérifier si la session existe déjà
      const { data: existingSession } = await supabase
        .from('voting_sessions')
        .select('id')
        .eq('blockchain_id', sessionId.toString())
        .single();

      if (existingSession) {
        console.log('🔄 Session déjà synchronisée:', sessionId.toString());
        return;
      }

      // Insérer la session
      const { error } = await supabase
        .from('voting_sessions')
        .insert({
          blockchain_id: sessionId.toString(),
          title,
          start_date: new Date(Number(startTime) * 1000).toISOString(),
          end_date: endTime > 0 ? new Date(Number(endTime) * 1000).toISOString() : null,
          is_active: true,
          total_votes: 0,
          created_from_blockchain: true
        });

      if (error) {
        console.error('❌ Erreur insertion session:', error);
        return;
      }

      console.log('✅ Session synchronisée:', title);
    } catch (error) {
      console.error('❌ Erreur traitement session:', error);
    }
  }

  /**
   * Mettre à jour le compteur de votes d'un candidat
   */
  private async updateCandidateVoteCount(candidateId: string) {
    try {
      // Compter les votes blockchain pour ce candidat
      const { count } = await supabase
        .from('blockchain_votes')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', candidateId);

      // Mettre à jour le candidat
      await supabase
        .from('candidates')
        .update({ vote_count: count || 0 })
        .eq('blockchain_id', candidateId);

    } catch (error) {
      console.error('❌ Erreur mise à jour compteur votes:', error);
    }
  }

  /**
   * Mettre à jour le statut de vote d'un utilisateur
   */
  private async updateUserVoteStatus(voterAddress: string, sessionId: string) {
    try {
      // Trouver le profil utilisateur par adresse wallet
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', voterAddress)
        .single();

      if (profile) {
        // Marquer comme ayant voté
        await supabase
          .from('profiles')
          .update({ has_voted: true })
          .eq('id', profile.id);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut utilisateur:', error);
    }
  }

  /**
   * Obtenir les statistiques de synchronisation
   */
  async getSyncStats() {
    try {
      const { count: totalVotes } = await supabase
        .from('blockchain_votes')
        .select('*', { count: 'exact', head: true });

      const { count: totalCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('created_from_blockchain', true);

      const { count: totalSessions } = await supabase
        .from('voting_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('created_from_blockchain', true);

      return {
        totalVotes: totalVotes || 0,
        totalCandidates: totalCandidates || 0,
        totalSessions: totalSessions || 0,
        isRunning: this.isRunning
      };
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error);
      return {
        totalVotes: 0,
        totalCandidates: 0,
        totalSessions: 0,
        isRunning: this.isRunning
      };
    }
  }
}

// Instance singleton
export const blockchainSync = new BlockchainSyncService();

// Fonctions utilitaires
export const startBlockchainSync = () => blockchainSync.startSync();
export const stopBlockchainSync = () => blockchainSync.stopSync();
export const getSyncStats = () => blockchainSync.getSyncStats();