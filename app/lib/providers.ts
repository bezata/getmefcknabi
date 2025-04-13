import { createPublicClient, http } from "viem";
import type { Address, PublicClient } from "viem";

// Alchemy API key - replace with your own or use environment variable
const ALCHEMY_API_KEY =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "aHK2851UBjpt0-LHxD3LX4NXnttXhcOL";

// Define chain types
export type SupportedChain =
  | "ethereum"
  | "ethereum-sepolia"
  | "polygon"
  | "polygon-mumbai"
  | "optimism"
  | "optimism-sepolia"
  | "arbitrum"
  | "arbitrum-sepolia"
  | "base"
  | "base-sepolia";

// Mapping of chain to Alchemy RPC subdomain
export const ALCHEMY_RPC_SUBDOMAIN: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
  "ethereum-sepolia": "eth-sepolia",
  polygon: "polygon-mainnet",
  "polygon-mumbai": "polygon-mumbai",
  optimism: "opt-mainnet",
  "optimism-sepolia": "opt-sepolia",
  arbitrum: "arb-mainnet",
  "arbitrum-sepolia": "arb-sepolia",
  base: "base-mainnet",
  "base-sepolia": "base-sepolia",
};

// Chain ID mapping
export const CHAIN_IDS: Record<SupportedChain, number> = {
  ethereum: 1,
  "ethereum-sepolia": 11155111,
  polygon: 137,
  "polygon-mumbai": 80001,
  optimism: 10,
  "optimism-sepolia": 11155420,
  arbitrum: 42161,
  "arbitrum-sepolia": 421614,
  base: 8453,
  "base-sepolia": 84532,
};

/**
 * Get the Alchemy RPC URL for a specific chain
 */
export function getAlchemyRPC(chain: SupportedChain): string {
  return `https://${ALCHEMY_RPC_SUBDOMAIN[chain]}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
}

/**
 * Create a public client for the specified chain using Alchemy RPC
 */
export function createChainClient(chain: SupportedChain): PublicClient {
  return createPublicClient({
    chain: {
      id: CHAIN_IDS[chain],
      name: chain,
      nativeCurrency: {
        name:
          chain.includes("ethereum") ||
          chain.includes("optimism") ||
          chain.includes("arbitrum") ||
          chain.includes("base")
            ? "Ether"
            : chain.includes("polygon")
            ? "MATIC"
            : "ETH",
        symbol: chain.includes("polygon") ? "MATIC" : "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: { http: [getAlchemyRPC(chain)] },
        public: { http: [getAlchemyRPC(chain)] },
      },
    },
    transport: http(getAlchemyRPC(chain)),
  });
}

/**
 * Get contract bytecode from a specific chain
 */
export async function getContractCode(
  chain: SupportedChain,
  address: Address
): Promise<string> {
  const client = createChainClient(chain);
  const code = await client.getCode({ address });
  return code || "0x";
}

/**
 * Simple function to check if a contract exists on a specific chain
 */
export async function contractExists(
  chain: SupportedChain,
  address: Address
): Promise<boolean> {
  try {
    const code = await getContractCode(chain, address);
    return code !== "0x" && code !== undefined;
  } catch (error) {
    console.error(`Error checking if contract exists on ${chain}:`, error);
    return false;
  }
}
