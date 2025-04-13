import dotenv from "dotenv";
import { Chain } from "viem";

// Load environment variables
dotenv.config();

// API keys from environment variables or use defaults
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";
const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY || "";

// Mapping of chain to Alchemy RPC subdomain
export const ALCHEMY_RPC_SUBDOMAIN: Record<string, string> = {
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

/**
 * Get Alchemy RPC URL for a specific chain
 * @param chain Chain name
 * @returns The Alchemy RPC URL for the specified chain
 */
export function getAlchemyRPC(chain: string): string | undefined {
  const subdomain = ALCHEMY_RPC_SUBDOMAIN[chain];
  if (!subdomain) {
    return undefined;
  }
  return `https://${subdomain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
}

/**
 * Enhanced chain configuration with all related information
 */
export interface ChainConfig {
  id: number;
  name: string;
  displayName: string;
  rpcUrls: {
    default: string;
    fallbacks: string[];
  };
  blockExplorerUrl?: string;
  testnet: boolean;
  ecosystem: "evm" | "solana" | "other";
  // Viem Chain object for compatibility with whatsabi client
  viemChain: Chain;
}

/**
 * Comprehensive chain configurations
 */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  // Ethereum Mainnet
  ethereum: {
    id: 1,
    name: "ethereum",
    displayName: "Ethereum",
    rpcUrls: {
      default:
        getAlchemyRPC("ethereum") || "https://eth-mainnet.g.alchemy.com/v2",
      fallbacks: [],
    },
    blockExplorerUrl: "https://etherscan.io",
    testnet: false,
    ecosystem: "evm",
    viemChain: {
      id: 1,
      name: "Ethereum",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            getAlchemyRPC("ethereum") || "https://eth-mainnet.g.alchemy.com/v2",
          ],
        },
        public: { http: ["https://eth-mainnet.g.alchemy.com/v2"] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: "https://etherscan.io" },
      },
    },
  },

  // Ethereum Sepolia
  "ethereum-sepolia": {
    id: 11155111,
    name: "ethereum-sepolia",
    displayName: "Ethereum Sepolia",
    rpcUrls: {
      default:
        getAlchemyRPC("ethereum-sepolia") ||
        "https://eth-sepolia.g.alchemy.com/v2",
      fallbacks: [],
    },
    blockExplorerUrl: "https://sepolia.etherscan.io",
    testnet: true,
    ecosystem: "evm",
    viemChain: {
      id: 11155111,
      name: "Sepolia",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            getAlchemyRPC("ethereum-sepolia") ||
              "https://eth-sepolia.g.alchemy.com/v2",
          ],
        },
        public: { http: ["https://eth-sepolia.g.alchemy.com/v2"] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: "https://sepolia.etherscan.io" },
      },
      testnet: true,
    },
  },

  // Polygon Mainnet
  polygon: {
    id: 137,
    name: "polygon",
    displayName: "Polygon",
    rpcUrls: {
      default:
        getAlchemyRPC("polygon") || "https://polygon-mainnet.g.alchemy.com/v2",
      fallbacks: [],
    },
    blockExplorerUrl: "https://polygonscan.com",
    testnet: false,
    ecosystem: "evm",
    viemChain: {
      id: 137,
      name: "Polygon",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            getAlchemyRPC("polygon") ||
              "https://polygon-mainnet.g.alchemy.com/v2",
          ],
        },
        public: { http: ["https://polygon-mainnet.g.alchemy.com/v2"] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: "https://polygonscan.com" },
      },
    },
  },

  // Optimism Mainnet
  optimism: {
    id: 10,
    name: "optimism",
    displayName: "Optimism",
    rpcUrls: {
      default:
        getAlchemyRPC("optimism") || "https://opt-mainnet.g.alchemy.com/v2",
      fallbacks: [],
    },
    blockExplorerUrl: "https://optimistic.etherscan.io",
    testnet: false,
    ecosystem: "evm",
    viemChain: {
      id: 10,
      name: "Optimism",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            getAlchemyRPC("optimism") || "https://opt-mainnet.g.alchemy.com/v2",
          ],
        },
        public: { http: ["https://opt-mainnet.g.alchemy.com/v2"] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: "https://optimistic.etherscan.io" },
      },
    },
  },

  // Base Mainnet
  base: {
    id: 8453,
    name: "base",
    displayName: "Base",
    rpcUrls: {
      default: getAlchemyRPC("base") || "https://base-mainnet.g.alchemy.com/v2",
      fallbacks: [],
    },
    blockExplorerUrl: "https://basescan.org",
    testnet: false,
    ecosystem: "evm",
    viemChain: {
      id: 8453,
      name: "Base",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            getAlchemyRPC("base") || "https://base-mainnet.g.alchemy.com/v2",
          ],
        },
        public: { http: ["https://base-mainnet.g.alchemy.com/v2"] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: "https://basescan.org" },
      },
    },
  },

  // Arbitrum One
  arbitrum: {
    id: 42161,
    name: "arbitrum",
    displayName: "Arbitrum One",
    rpcUrls: {
      default:
        getAlchemyRPC("arbitrum") || "https://arb-mainnet.g.alchemy.com/v2",
      fallbacks: [],
    },
    blockExplorerUrl: "https://arbiscan.io",
    testnet: false,
    ecosystem: "evm",
    viemChain: {
      id: 42161,
      name: "Arbitrum",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            getAlchemyRPC("arbitrum") || "https://arb-mainnet.g.alchemy.com/v2",
          ],
        },
        public: { http: ["https://arb-mainnet.g.alchemy.com/v2"] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: "https://arbiscan.io" },
      },
    },
  },
};

// Generate ID to name mapping for lookups
export const CHAIN_ID_TO_CONFIG: Record<number, ChainConfig> = Object.values(
  CHAIN_CONFIGS
).reduce((acc, config) => {
  acc[config.id] = config;
  return acc;
}, {} as Record<number, ChainConfig>);

// Keep mappings for backward compatibility
export const CHAIN_ID_MAP: Record<string, number> = Object.values(
  CHAIN_CONFIGS
).reduce((acc, config) => {
  acc[config.name] = config.id;
  return acc;
}, {} as Record<string, number>);

export const CHAIN_ID_TO_NAME: Record<number, string> = Object.entries(
  CHAIN_ID_MAP
).reduce((acc, [name, id]) => {
  acc[id] = name;
  return acc;
}, {} as Record<number, string>);

/**
 * Get the complete chain configuration by chain name
 * @param chainName The name of the chain (e.g., "ethereum-sepolia")
 * @returns The complete chain configuration or undefined if not found
 */
export function getChainConfigByName(
  chainName: string
): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainName];
}

/**
 * Get the complete chain configuration by chain ID
 * @param chainId The ID of the chain
 * @returns The complete chain configuration or undefined if not found
 */
export function getChainConfigById(
  chainId: number | string
): ChainConfig | undefined {
  const numericChainId =
    typeof chainId === "string" ? parseInt(chainId) : chainId;
  return CHAIN_ID_TO_CONFIG[numericChainId];
}

/**
 * Get the RPC URL for a specific chain by its name
 * @param chainName The name of the chain (e.g., "ethereum-sepolia")
 * @returns The RPC URL for the chain or undefined if not found
 */
export function getRpcUrlByChainName(chainName: string): string | undefined {
  // First, try to get a chain-specific environment variable
  const envKey = `NEXT_PUBLIC_${chainName
    .toUpperCase()
    .replace(/-/g, "_")}_RPC_URL`;
  if (process.env[envKey]) {
    return process.env[envKey];
  }

  // Check if we have a config for this chain
  const chainConfig = CHAIN_CONFIGS[chainName];
  if (chainConfig) {
    // Return the default RPC URL from our config
    return chainConfig.rpcUrls.default;
  }

  // Fall back to default provider URL if set
  if (process.env.NEXT_PUBLIC_RPC_URL) {
    return process.env.NEXT_PUBLIC_RPC_URL;
  }

  return undefined;
}

/**
 * Get the RPC URL for a specific chain by its ID
 * @param chainId The ID of the chain
 * @returns The RPC URL for the chain or undefined if not found
 */
export function getRpcUrlByChainId(
  chainId: string | number
): string | undefined {
  // Convert numeric chainId to string if needed
  const numericChainId =
    typeof chainId === "string" ? parseInt(chainId) : chainId;

  // Look up the chain config from the ID
  const chainConfig = CHAIN_ID_TO_CONFIG[numericChainId];
  if (chainConfig) {
    return chainConfig.rpcUrls.default;
  }

  // Fall back to the old method using chain name lookup
  const chainName = CHAIN_ID_TO_NAME[numericChainId];
  if (chainName) {
    return getRpcUrlByChainName(chainName);
  }

  // No chain name found for this ID
  console.warn(`No chain name found for chain ID: ${chainId}`);

  // Fall back to default RPC_URL if available
  if (process.env.NEXT_PUBLIC_RPC_URL) {
    return process.env.NEXT_PUBLIC_RPC_URL;
  }

  return undefined;
}

/**
 * Get a fallback RPC URL for a chain if the primary one fails
 * @param chainId The ID of the chain
 * @returns A fallback RPC URL or undefined if none available
 */
export function getFallbackRpcUrl(
  chainId: string | number
): string | undefined {
  const numericChainId =
    typeof chainId === "string" ? parseInt(chainId) : chainId;
  const chainConfig = CHAIN_ID_TO_CONFIG[numericChainId];

  if (chainConfig && chainConfig.rpcUrls.fallbacks.length > 0) {
    // Return the first fallback URL
    return chainConfig.rpcUrls.fallbacks[0];
  }

  return undefined;
}

/**
 * Get the Viem Chain object for a specific chain ID
 * @param chainId The chain ID to get the Viem Chain for
 * @returns The Viem Chain object or undefined if not found
 */
export function getViemChainById(chainId: number): Chain | undefined {
  const chainConfig = CHAIN_ID_TO_CONFIG[chainId];
  if (chainConfig) {
    return chainConfig.viemChain;
  }
  return undefined;
}

/**
 * Get the block explorer URL for a chain
 * @param chainId The ID of the chain
 * @returns The block explorer URL or undefined if not found
 */
export function getBlockExplorerUrl(
  chainId: string | number
): string | undefined {
  const numericChainId =
    typeof chainId === "string" ? parseInt(chainId) : chainId;
  const chainConfig = CHAIN_ID_TO_CONFIG[numericChainId];

  return chainConfig?.blockExplorerUrl;
}

/**
 * Get transaction URL in block explorer
 * @param chainId The chain ID
 * @param txHash The transaction hash
 * @returns The full URL to the transaction in the block explorer
 */
export function getTransactionUrl(
  chainId: string | number,
  txHash: string
): string | undefined {
  const explorerUrl = getBlockExplorerUrl(chainId);
  if (!explorerUrl || !txHash) {
    return undefined;
  }

  return `${explorerUrl}/tx/${txHash}`;
}

/**
 * Get address URL in block explorer
 * @param chainId The chain ID
 * @param address The Ethereum address
 * @returns The full URL to the address in the block explorer
 */
export function getAddressUrl(
  chainId: string | number,
  address: string
): string | undefined {
  const explorerUrl = getBlockExplorerUrl(chainId);
  if (!explorerUrl || !address) {
    return undefined;
  }

  return `${explorerUrl}/address/${address}`;
}

// Add a cache for RPC URL health checks
const rpcUrlHealthCache: Record<
  string,
  {
    timestamp: number;
    healthy: boolean;
    latency?: number;
  }
> = {};

// Cache timeout in milliseconds (5 minutes)
const HEALTH_CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Check if an RPC URL is healthy by making a simple eth_blockNumber request
 * @param rpcUrl The RPC URL to check
 * @returns Promise resolving to boolean indicating if the RPC is healthy
 */
export async function isRpcUrlHealthy(rpcUrl: string): Promise<boolean> {
  try {
    // Check cache first
    const cachedHealth = rpcUrlHealthCache[rpcUrl];
    if (
      cachedHealth &&
      Date.now() - cachedHealth.timestamp < HEALTH_CACHE_TIMEOUT
    ) {
      return cachedHealth.healthy;
    }

    // Make a simple eth_blockNumber request
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;
    const result = await response.json();
    const healthy = response.ok && !result.error && result.result;

    // Cache the result
    rpcUrlHealthCache[rpcUrl] = {
      timestamp: Date.now(),
      healthy,
      latency,
    };

    return healthy;
  } catch (error) {
    console.warn(`Error checking RPC URL health for ${rpcUrl}: ${error}`);

    // Cache the unhealthy result
    rpcUrlHealthCache[rpcUrl] = {
      timestamp: Date.now(),
      healthy: false,
    };

    return false;
  }
}

/**
 * Gets the best available RPC URL for a chain, checking health if checkHealth is true
 * @param chainId The chain ID to get the RPC URL for
 * @param checkHealth Whether to check RPC URL health
 * @returns Promise resolving to the best available RPC URL
 */
export async function getBestRpcUrlByChainId(
  chainId: string | number,
  checkHealth = true
): Promise<string | undefined> {
  try {
    // Get the primary RPC URL
    const primaryUrl = getRpcUrlByChainId(chainId);
    if (!primaryUrl) {
      return undefined;
    }

    // If not checking health, just return the primary URL
    if (!checkHealth) {
      return primaryUrl;
    }

    // Check if the primary URL is healthy
    const isPrimaryHealthy = await isRpcUrlHealthy(primaryUrl);
    if (isPrimaryHealthy) {
      return primaryUrl;
    }

    // If primary URL is unhealthy, try fallbacks
    const fallbackUrl = getFallbackRpcUrl(chainId);
    if (fallbackUrl) {
      const isFallbackHealthy = await isRpcUrlHealthy(fallbackUrl);
      if (isFallbackHealthy) {
        console.info(`Using fallback RPC URL for chain ${chainId}`);
        return fallbackUrl;
      }
    }

    // If we get here, no healthy RPC URLs were found
    console.warn(
      `No healthy RPC URLs found for chain ${chainId}, using primary anyway`
    );
    return primaryUrl;
  } catch (error) {
    console.error(`Error getting best RPC URL for chain ${chainId}: ${error}`);
    return getRpcUrlByChainId(chainId);
  }
}
