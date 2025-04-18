import Dexie, { Table } from "dexie";
import { CustomChain } from "../components/CustomChainModal";
import { ContractFunction } from "./whatsabi";

// Define an interface for cached contract ABIs
export interface CachedContractABI {
  id?: number; // Auto-incremented primary key
  address: string; // Contract address (lowercased)
  chainId: number; // Chain ID
  abi: string; // Stringified ABI
  functions: string; // Stringified functions array
  timestamp: number; // When it was cached
  verified: boolean; // Whether this is from a verified source
}

// Define the database
class ChainDatabase extends Dexie {
  customChains!: Table<CustomChain, number>;
  cachedABIs!: Table<CachedContractABI, number>;

  constructor() {
    super("getmefcknabi_db");

    // Define tables and indices
    this.version(1).stores({
      customChains: "id, name, rpcUrl, blockExplorerUrl, isTestnet",
    });

    // Add version 2 with cachedABIs table
    this.version(2).stores({
      customChains: "id, name, rpcUrl, blockExplorerUrl, isTestnet",
      cachedABIs: "++id, [address+chainId], address, chainId, timestamp",
    });

    // Add hooks for debugging
    this.customChains.hook("reading", (obj: CustomChain) => {
      console.log("Reading chain:", obj);
      return obj;
    });

    this.customChains.hook(
      "updating",
      (mods: any, primKey: number, obj: CustomChain) => {
        console.log("Updating chain:", { mods, primKey, obj });
        return mods;
      }
    );
  }
}

// Create a singleton instance of the database
const db = new ChainDatabase();

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    await db.open();
    console.log("Database opened successfully");
  } catch (error) {
    console.error("Failed to open database:", error);
    // If there's an error, try to delete and recreate the database
    try {
      await db.delete();
      await db.open();
      console.log("Database recreated successfully");
    } catch (error) {
      console.error("Failed to recreate database:", error);
      throw error;
    }
  }
};

// Functions for chain operations
export const saveCustomChain = async (chain: CustomChain): Promise<void> => {
  try {
    console.log("Starting to save chain:", chain);
    const response = await fetch("/api/chains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chain),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server error response:", data);
      throw new Error(data.error || "Failed to save chain");
    }

    console.log("Chain saved successfully:", data);
  } catch (error) {
    console.error("Error saving custom chain:", error);
    throw error;
  }
};

export const getAllCustomChains = async (): Promise<CustomChain[]> => {
  try {
    console.log("Fetching all custom chains...");
    const response = await fetch("/api/chains");

    const data = await response.json();

    if (!response.ok) {
      console.error("Server error response:", data);
      throw new Error(data.error || "Failed to fetch chains");
    }

    console.log("Retrieved chains from MongoDB:", data);
    return data;
  } catch (error) {
    console.error("Error getting custom chains:", error);
    return [];
  }
};

export const deleteCustomChain = async (chainId: number): Promise<void> => {
  try {
    console.log("Attempting to delete chain:", chainId);
    const response = await fetch("/api/chains", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chainId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server error response:", data);
      throw new Error(data.error || "Failed to delete chain");
    }

    console.log("Chain deleted successfully:", data);
  } catch (error) {
    console.error("Error deleting custom chain:", error);
    throw error;
  }
};

export const getCustomChainById = async (
  chainId: number
): Promise<CustomChain | undefined> => {
  try {
    console.log("Fetching chain by ID:", chainId);
    const chains = await getAllCustomChains();
    const chain = chains.find((chain) => chain.id === chainId);
    console.log("Found chain:", chain);
    return chain;
  } catch (error) {
    console.error(`Error getting chain with ID ${chainId}:`, error);
    return undefined;
  }
};

// Database is always ready since we're using REST API
export const isDatabaseReady = async (): Promise<boolean> => {
  try {
    const chains = await getAllCustomChains();
    return true;
  } catch (error) {
    console.error("Database not ready:", error);
    return false;
  }
};

// ABI Caching functions
export const cacheContractABI = async (
  address: string,
  chainId: number,
  abi: string,
  functions: ContractFunction[],
  verified: boolean = false
): Promise<void> => {
  try {
    // Normalize the address
    const normalizedAddress = address.toLowerCase();

    // Check if we already have this ABI
    const existingRecord = await db.cachedABIs
      .where("[address+chainId]")
      .equals([normalizedAddress, chainId])
      .first();

    // JSON stringify the functions array
    const functionsString = JSON.stringify(functions);

    if (existingRecord) {
      // Update existing record
      await db.cachedABIs.update(existingRecord.id!, {
        abi,
        functions: functionsString,
        timestamp: Date.now(),
        verified: verified || existingRecord.verified, // Keep verified flag if it was already verified
      });
      console.log(
        `Updated cached ABI for ${normalizedAddress} on chain ${chainId}`
      );
    } else {
      // Add new record
      await db.cachedABIs.add({
        address: normalizedAddress,
        chainId,
        abi,
        functions: functionsString,
        timestamp: Date.now(),
        verified,
      });
      console.log(`Cached ABI for ${normalizedAddress} on chain ${chainId}`);
    }
  } catch (error) {
    console.error("Error caching contract ABI:", error);
  }
};

export const getCachedContractABI = async (
  address: string,
  chainId: number
): Promise<{ abi: string; functions: ContractFunction[] } | null> => {
  try {
    // Normalize the address
    const normalizedAddress = address.toLowerCase();

    // Look up the ABI in the cache
    const cachedEntry = await db.cachedABIs
      .where("[address+chainId]")
      .equals([normalizedAddress, chainId])
      .first();

    if (cachedEntry) {
      // Check if the cached entry is reasonably fresh (7 days)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      if (cachedEntry.timestamp > oneWeekAgo || cachedEntry.verified) {
        console.log(
          `Using cached ABI for ${normalizedAddress} on chain ${chainId}`
        );
        // Parse the functions string back to an array
        const functions = JSON.parse(
          cachedEntry.functions
        ) as ContractFunction[];
        return {
          abi: cachedEntry.abi,
          functions,
        };
      } else {
        console.log(
          `Cached ABI for ${normalizedAddress} is outdated. Cached on: ${new Date(
            cachedEntry.timestamp
          ).toLocaleString()}`
        );
        return null;
      }
    }

    console.log(
      `No cached ABI found for ${normalizedAddress} on chain ${chainId}`
    );
    return null;
  } catch (error) {
    console.error("Error retrieving cached contract ABI:", error);
    return null;
  }
};

export const clearCachedContractABIs = async (): Promise<void> => {
  try {
    await db.cachedABIs.clear();
    console.log("Cleared all cached ABIs");
  } catch (error) {
    console.error("Error clearing cached ABIs:", error);
  }
};

export default db;
