import Dexie, { Table } from "dexie";
import { CustomChain } from "../components/CustomChainModal";

// Define the database
class ChainDatabase extends Dexie {
  customChains!: Table<CustomChain, number>;

  constructor() {
    super("getmefcknabi_db");

    // Define tables and indices
    this.version(1).stores({
      customChains: "id, name, rpcUrl, blockExplorerUrl, isTestnet",
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

export default db;
