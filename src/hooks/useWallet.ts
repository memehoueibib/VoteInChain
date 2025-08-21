import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  loading: boolean;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    loading: true
  });

  // Vérifier si MetaMask est installé
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Connecter le wallet
  const connectWallet = useCallback(async () => {
    try {
      if (!isMetaMaskInstalled()) {
        console.log('MetaMask n\'est pas installé');
        return false;
      }

      setWalletState(prev => ({ ...prev, loading: true }));
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      if (accounts.length > 0) {
        const newState = {
          isConnected: true,
          address: accounts[0],
          chainId,
          loading: false
        };
        
        setWalletState(newState);
        
        // Sauvegarder dans localStorage
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', accounts[0]);
        
        console.log('Wallet connecté:', accounts[0]);
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion MetaMask:', error);
      setWalletState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Déconnecter le wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      loading: false
    });
    
    // Supprimer de localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    
    console.log('Wallet déconnecté');
  }, []);

  // Vérifier la connexion existante
  const checkConnection = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setWalletState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Vérifier localStorage d'abord
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      const savedAddress = localStorage.getItem('walletAddress');

      if (wasConnected && savedAddress) {
        // Vérifier si le compte est toujours accessible
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });

          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId,
            loading: false
          });
          
          console.log('Connexion wallet restaurée:', accounts[0]);
          return;
        }
      }

      // Si pas de connexion sauvegardée ou compte non accessible
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        loading: false
      });
      
      // Nettoyer localStorage si nécessaire
      if (wasConnected) {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
      }
      
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        loading: false
      });
    }
  }, [isMetaMaskInstalled]);

  // Écouter les changements de compte/réseau
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true
        }));
        localStorage.setItem('walletAddress', accounts[0]);
        console.log('Compte changé:', accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWalletState(prev => ({
        ...prev,
        chainId
      }));
      console.log('Réseau changé:', chainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, disconnectWallet]);

  // Vérification périodique de la connexion
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletState.isConnected) {
        checkConnection();
      }
    }, 3000); // Vérifier toutes les 3 secondes

    return () => clearInterval(interval);
  }, [walletState.isConnected, checkConnection]);

  // Vérifier la connexion au montage
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    checkConnection,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
};