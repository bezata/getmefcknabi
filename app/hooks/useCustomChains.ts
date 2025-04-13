"use client";

import { useState, useEffect } from "react";
import { CustomChain } from "../components/CustomChainModal";
import {
  CHAIN_CONFIGS,
  ChainConfig,
  getChainConfigById,
  CHAIN_ID_TO_CONFIG,
  getBestRpcUrlByChainId,
} from "../lib/chainConfig";
import { createPublicClient, http, Chain } from "viem";
import {
  getAllCustomChains,
  saveCustomChain,
  deleteCustomChain,
  isDatabaseReady,
} from "../lib/db";

// LocalStorage key for private chains
const PRIVATE_CHAINS_KEY = 'getmefcknabi_private_chains';

// Helper to convert ChainConfig to CustomChain
const chainConfigToCustomChain = (config: ChainConfig): CustomChain => {
  return {
    id: config.id,
    name: config.displayName,
    rpcUrl: config.rpcUrls.default,
    blockExplorerUrl: config.blockExplorerUrl,
    isTestnet: config.testnet,
  };
};

export default function useCustomChains() {
  const [customChains, setCustomChains] = useState<CustomChain[]>([]);
  const [privateChains, setPrivateChains] = useState<CustomChain[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [defaultChains, setDefaultChains] = useState<CustomChain[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load built-in chains on init
  useEffect(() => {
    const chains = Object.values(CHAIN_CONFIGS).map(chainConfigToCustomChain);
    setDefaultChains(chains);
  }, []);

  // Load private chains from localStorage
  const loadPrivateChains = () => {
    try {
      const privateChainData = localStorage.getItem(PRIVATE_CHAINS_KEY);
      if (privateChainData) {
        const parsedChains = JSON.parse(privateChainData) as CustomChain[];
        console.log("Loaded private chains from localStorage:", parsedChains);
        setPrivateChains(parsedChains);
      }
    } catch (error) {
      console.error("Failed to load private chains from localStorage:", error);
    }
  };

  // Save private chains to localStorage
  const savePrivateChains = (chains: CustomChain[]) => {
    try {
      localStorage.setItem(PRIVATE_CHAINS_KEY, JSON.stringify(chains));
    } catch (error) {
      console.error("Failed to save private chains to localStorage:", error);
    }
  };

  // Load custom chains from IndexedDB on mount
  useEffect(() => {
    const loadCustomChains = async () => {
      try {
        // Wait for database to be ready
        const isReady = await isDatabaseReady();
        if (!isReady) {
          throw new Error("Database failed to initialize");
        }

        const chains = await getAllCustomChains();
        console.log("Loaded custom chains from IndexedDB:", chains);
        setCustomChains(chains);
        setDbError(null);

        // Also load private chains from localStorage
        loadPrivateChains();
      } catch (error) {
        console.error("Failed to load custom chains:", error);
        setDbError(
          error instanceof Error ? error.message : "Unknown database error"
        );
        
        // Still try to load private chains even if DB failed
        loadPrivateChains();
      } finally {
        setIsLoaded(true);
      }
    };

    loadCustomChains();
  }, []);

  // Add a new chain
  const addChain = async (chain: CustomChain) => {
    try {
      console.log("Adding chain with full data:", chain);

      // Ensure the chain has all required properties
      const chainToSave: CustomChain = {
        id: chain.id,
        name: chain.name,
        rpcUrl: chain.rpcUrl,
        blockExplorerUrl: chain.blockExplorerUrl,
        isTestnet: chain.isTestnet ?? false,
        isPrivate: chain.isPrivate ?? false
      };

      if (chainToSave.isPrivate) {
        // Save to localStorage for private chains
        const updatedPrivateChains = [...privateChains];
        
        // Remove any existing chain with same ID if present
        const existingIndex = updatedPrivateChains.findIndex(c => c.id === chain.id);
        if (existingIndex !== -1) {
          updatedPrivateChains.splice(existingIndex, 1);
        }
        
        // Add new chain
        updatedPrivateChains.push(chainToSave);
        
        // Save to localStorage and update state
        savePrivateChains(updatedPrivateChains);
        setPrivateChains(updatedPrivateChains);
        console.log("Private chain saved to localStorage:", chainToSave);
      } else {
        // Save to IndexedDB for public chains
        await saveCustomChain(chainToSave);

        // Verify the chain was saved by reloading all chains
        const updatedChains = await getAllCustomChains();
        console.log("Updated chains after save:", updatedChains);
        
        // Update local state
        setCustomChains(updatedChains);
      }
      
      setDbError(null);
    } catch (error) {
      console.error("Failed to add custom chain:", error);
      setDbError(
        error instanceof Error ? error.message : "Failed to save chain"
      );
      throw error;
    }
  };

  // Remove a chain
  const removeChain = async (chainId: number) => {
    try {
      // Check if it's in the private chains first
      const privateChainIndex = privateChains.findIndex(c => c.id === chainId);
      
      if (privateChainIndex !== -1) {
        // Remove from private chains
        const updatedPrivateChains = [...privateChains];
        updatedPrivateChains.splice(privateChainIndex, 1);
        savePrivateChains(updatedPrivateChains);
        setPrivateChains(updatedPrivateChains);
        console.log("Removed private chain:", chainId);
      } else {
        // Otherwise, delete from database
        await deleteCustomChain(chainId);
        
        // Verify deletion by reloading chains
        const remainingChains = await getAllCustomChains();
        console.log("Remaining chains after deletion:", remainingChains);
        
        setCustomChains(remainingChains);
      }
      
      setDbError(null);
    } catch (error) {
      console.error("Failed to remove custom chain:", error);
      setDbError(
        error instanceof Error ? error.message : "Failed to remove chain"
      );
      throw error;
    }
  };

  // Get all chains (built-in, custom, and private)
  const getAllChains = () => {
    // Start with default chains
    const allChains = [...defaultChains];

    // Add custom database chains
    customChains.forEach((customChain) => {
      const index = allChains.findIndex((chain) => chain.id === customChain.id);
      if (index !== -1) {
        allChains[index] = customChain;
      } else {
        allChains.push(customChain);
      }
    });
    
    // Add private localStorage chains
    privateChains.forEach((privateChain) => {
      const index = allChains.findIndex((chain) => chain.id === privateChain.id);
      if (index !== -1) {
        allChains[index] = privateChain;
      } else {
        allChains.push(privateChain);
      }
    });

    // Sort chains: mainnets first, then testnets, then by name
    return allChains.sort((a, b) => {
      if ((a.isTestnet ?? false) !== (b.isTestnet ?? false)) {
        return a.isTestnet ?? false ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Create a viem public client for a specific chain
  const createClientForChain = async (chainId: number) => {
    try {
      // Get the chain configuration
      const chainConfig = getChainConfigById(chainId);

      // If it's a built-in chain, use its viem chain object
      if (chainConfig) {
        const rpcUrl = await getBestRpcUrlByChainId(chainId, true);
        return createPublicClient({
          chain: chainConfig.viemChain,
          transport: http(rpcUrl),
        });
      }

      // Check for custom chain (either from DB or localStorage)
      const customChain = customChains.find((c) => c.id === chainId);
      const privateChain = privateChains.find((c) => c.id === chainId);
      const foundChain = customChain || privateChain;
      
      if (foundChain) {
        // Create a minimal chain configuration for viem
        const viemChain: Chain = {
          id: foundChain.id,
          name: foundChain.name,
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: {
            default: { http: [foundChain.rpcUrl] },
            public: { http: [foundChain.rpcUrl] },
          },
        };

        return createPublicClient({
          chain: viemChain,
          transport: http(foundChain.rpcUrl),
        });
      }

      throw new Error(`No configuration found for chain ID ${chainId}`);
    } catch (error) {
      console.error(`Error creating client for chain ${chainId}:`, error);
      throw error;
    }
  };

  // Check if an RPC endpoint is valid by attempting a basic call
  const validateRpcEndpoint = async (
    rpcUrl: string,
    chainId: number
  ): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      // Verify that the chain ID matches
      if (data?.result) {
        const returnedChainId = parseInt(data.result, 16);
        return returnedChainId === chainId;
      }

      return false;
    } catch (error) {
      console.error("RPC validation error:", error);
      return false;
    }
  };

  return {
    customChains,
    privateChains,
    isLoaded,
    dbError,
    addChain,
    removeChain,
    getAllChains,
    createClientForChain,
    validateRpcEndpoint,
  };
}
