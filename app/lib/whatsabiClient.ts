import { type Address, type PublicClient } from "viem";
import { WhatsABIWrapper } from "./whatsabi";
import { createChainClient, type SupportedChain, CHAIN_IDS } from "./providers";

// Create a singleton instance of WhatsABI client per chain
const whatsabiClients: Record<SupportedChain, WhatsABIWrapper | null> = {
  ethereum: null,
  "ethereum-sepolia": null,
  polygon: null,
  "polygon-mumbai": null,
  optimism: null,
  "optimism-sepolia": null,
  arbitrum: null,
  "arbitrum-sepolia": null,
  base: null,
  "base-sepolia": null,
};

/**
 * Get WhatsABI client for a specific chain
 * @param chain The chain name to use
 * @returns The WhatsABI client instance
 */
export async function getWhatsABIClient(
  chain: SupportedChain = "ethereum"
): Promise<WhatsABIWrapper> {
  try {
    const chainId = CHAIN_IDS[chain];

    // If client doesn't exist for this chain, create one
    if (!whatsabiClients[chain]) {
      // Create a public client for the specified chain
      const publicClient = createChainClient(chain);

      // Get etherscan API key from environment
      const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

      // Create a new WhatsABI client
      whatsabiClients[chain] = new WhatsABIWrapper(publicClient, {
        etherscanApiKey,
        chainId,
      });

      console.info(`Created WhatsABI client for chain ${chain} (${chainId})`);
    }

    return whatsabiClients[chain]!;
  } catch (error) {
    console.error(`Error getting WhatsABI client for chain ${chain}:`, error);
    throw error;
  }
}

/**
 * Function to get WhatsABI client by chain ID instead of name
 * @param chainId The chain ID to use
 */
export async function getWhatsABIClientById(
  chainId: number = 1
): Promise<WhatsABIWrapper> {
  // Find the chain name based on ID
  const chainEntries = Object.entries(CHAIN_IDS);
  const chainEntry = chainEntries.find(([_, id]) => id === chainId);

  if (!chainEntry) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const chainName = chainEntry[0] as SupportedChain;
  return getWhatsABIClient(chainName);
}

/**
 * Reset all WhatsABI clients (for testing)
 */
export function resetWhatsABIClients(): void {
  Object.keys(whatsabiClients).forEach((chain) => {
    whatsabiClients[chain as SupportedChain] = null;
  });
}
