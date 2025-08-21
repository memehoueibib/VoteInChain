export interface User {
  id: string;
  email: string;
  wallet_address?: string;
  role: 'voter' | 'admin';
  created_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  vote_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  candidate_id: string;
  transaction_hash?: string;
  created_at: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  total_votes: number;
}

export interface WalletConnection {
  address: string;
  provider: any;
  signer: any;
  isConnected: boolean;
}