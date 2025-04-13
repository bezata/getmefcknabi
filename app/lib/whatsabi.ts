import {
  type Address,
  type PublicClient,
  createPublicClient,
  getAddress,
  http,
  isAddress,
} from "viem";
import { whatsabi } from "@shazow/whatsabi";
import { mainnet } from "viem/chains";

const {
  SourcifyABILoader,
  EtherscanABILoader,
  MultiABILoader,
  FourByteSignatureLookup,
  OpenChainSignatureLookup,
  MultiSignatureLookup,
} = whatsabi.loaders;

// Define WhatsABIResult interface locally
export interface WhatsABIResult {
  abi: any[];
  address: Address;
  selectors?: string[];
  proxy?: any;
  name?: string;
}

export interface ContractCallParams {
  functionName: string;
  signature?: string;
  sighash?: string;
  args?: any[];
}

export interface ContractFunction {
  name: string;
  signature: string;
  sighash?: string;
  inputs: {
    name: string;
    type: string;
  }[];
  outputs: {
    name: string;
    type: string;
  }[];
  stateMutability: string;
}

// Default ABI for common ERC20 functions
export const FALLBACK_ERC20_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
];

export class WhatsABIWrapper {
  private loader!: InstanceType<typeof MultiABILoader>;
  private signatureLookup!: InstanceType<typeof MultiSignatureLookup>;
  private abiCache: Map<string, WhatsABIResult> = new Map();
  private currentChainId: number;
  private options: {
    etherscanApiKey?: string;
    chainId?: number;
  };

  constructor(
    private publicClient: PublicClient,
    config?: {
      etherscanApiKey?: string;
      chainId?: number;
    }
  ) {
    this.currentChainId = config?.chainId || 1; // Default to mainnet
    this.options = config || {};
    this.initializeLoaders(config);
    this.initializeSignatureLookup();
  }

  // Add method to update the public client when changing RPC URLs
  /**
   * Update the public client to use a new RPC URL
   * @param newPublicClient The new public client to use
   */
  updatePublicClient(newPublicClient: PublicClient): void {
    this.publicClient = newPublicClient;
    // Get the chain ID from the new client if possible
    try {
      newPublicClient
        .getChainId()
        .then((chainId) => {
          if (chainId !== this.currentChainId) {
            this.setChainId(chainId);
          }
        })
        .catch((error) => {
          console.warn(`Could not get chain ID from new client: ${error}`);
        });
    } catch (error) {
      console.warn(`Error updating public client: ${error}`);
    }
  }

  private initializeLoaders(config?: { etherscanApiKey?: string }) {
    // Create multiple ABI loaders for better coverage
    this.loader = new MultiABILoader([
      // Sourcify is a decentralized contract verification service
      new SourcifyABILoader({
        chainId: this.currentChainId,
      }),
      // Etherscan for verified contracts
      new EtherscanABILoader({
        apiKey:
          config?.etherscanApiKey || process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      }),
      // We don't include AnyABILoader as it's not available in the current version
    ]);
  }

  private initializeSignatureLookup() {
    // Create multiple signature lookups for better coverage
    try {
      // Create our own modified OpenChainSignatureLookup with certificate bypass
      const customOpenChainLookup = {
        ...new OpenChainSignatureLookup(),
        // Override the loadFunctions method to bypass certificate verification
        loadFunctions: async (selector: string): Promise<string[]> => {
          try {
            const selectorWithoutPrefix = selector.startsWith("0x")
              ? selector.slice(2)
              : selector;

            // Direct API call with certificate bypass
            const url = `https://openchain.xyz/api/v1/signatures?function=${selectorWithoutPrefix}`;

            const response = await this.fetchWithCertBypass(url);

            if (!response.ok) {
              throw new Error(`OpenChain API error: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.result && Array.isArray(data.result)) {
              return data.result.map((item: any) => item.signature);
            }

            return [];
          } catch (error) {
            console.error("Custom OpenChain lookup error:", error);
            return []; // Return empty array on error
          }
        },
      };

      this.signatureLookup = new MultiSignatureLookup([
        // Default loaders
        new FourByteSignatureLookup(),
        // Our custom OpenChain with certificate bypass
        customOpenChainLookup as any,
      ]);

      console.log(
        "Initialized signature lookup with both 4byte and custom OpenChain"
      );
    } catch (error) {
      console.error("Error initializing signature lookup:", error);
      // Fallback to just 4byte if there's an error
      this.signatureLookup = new MultiSignatureLookup([
        new FourByteSignatureLookup(),
      ]);
      console.log(
        "Initialized signature lookup with 4byte only (fallback mode)"
      );
    }
  }

  /**
   * Helper method to make fetch requests with SSL certificate bypass
   */
  private async fetchWithCertBypass(url: string): Promise<Response> {
    // Use different approaches for browser vs Node environment
    if (typeof window === "undefined") {
      // Node.js environment
      try {
        // For Next.js, we can use the native Node.js https module
        // to make requests with certificate bypass
        const https = require("https");
        const { URL } = require("url");

        // Return a Promise that resolves to a Response
        return new Promise((resolve, reject) => {
          const parsedUrl = new URL(url);

          const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            port:
              parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 WhatsABI",
            },
            rejectUnauthorized: false, // This is the key option for bypassing certificate validation
          };

          const req = https.request(options, (res: any) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk: Buffer) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();

              // Create a Response object that mimics the fetch API
              resolve(
                new Response(body, {
                  status: res.statusCode,
                  headers: res.headers,
                })
              );
            });
          });

          req.on("error", (error: Error) => {
            reject(error);
          });

          req.end();
        });
      } catch (error) {
        console.error("Error making HTTPS request:", error);
        // Return a mock response on error
        return new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Browser environment - use standard fetch
      // Note: Browsers don't allow certificate bypass from JavaScript
      // So we'll try normal fetch and fallback gracefully
      try {
        return await fetch(url);
      } catch (error) {
        console.warn(
          "Browser fetch failed (likely due to certificate):",
          error
        );
        // Return a mock response that signals failure
        return new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  /**
   * Set a new chain ID and reinitialize loaders
   * @param chainId The new chain ID to use
   */
  async setChainId(chainId: number) {
    if (this.currentChainId !== chainId) {
      this.currentChainId = chainId;
      this.clearCache(); // Clear cache when changing chains
      this.initializeLoaders();
      console.log(`Chain ID updated to: ${chainId}`);
    }
  }

  /**
   * Get the current chain ID
   * @returns The current chain ID
   */
  getCurrentChainId(): number {
    return this.currentChainId;
  }

  // Add a new helper method to determine if proxy resolution should be enabled
  private shouldEnableProxyResolution(chainId: number): boolean {
    // Known problematic chains where eth_getStorageAt has issues
    const problematicChains = [
      421614, // Arbitrum Sepolia
    ];

    return !problematicChains.includes(chainId);
  }

  /**
   * Parse contract ABI using WhatsABI with current chain ID
   */
  async parseContract(contractAddress: Address): Promise<WhatsABIResult> {
    try {
      console.log(
        "WhatsABI - parseContract called with address:",
        contractAddress
      );

      // Validate contract address
      if (
        !contractAddress ||
        contractAddress === "0x" ||
        contractAddress === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error("Invalid contract address");
      }

      // Get the current chain ID from the client if available
      const clientChainId = await this.publicClient.getChainId();
      if (clientChainId !== this.currentChainId) {
        await this.setChainId(clientChainId);
      }

      // Check cache first
      const cacheKey = `${contractAddress.toLowerCase()}-${
        this.currentChainId
      }`;
      const cachedResult = this.abiCache.get(cacheKey);
      if (cachedResult) {
        console.log("WhatsABI - Using cached result for:", contractAddress);
        return cachedResult;
      }

      // Get the bytecode
      console.log("WhatsABI - About to get code for address:", contractAddress);
      const code = await this.publicClient.getCode({
        address: contractAddress,
      });

      console.log("WhatsABI - getCode result length:", code?.length);
      if (!code || code === "0x") {
        throw new Error("No bytecode found for contract");
      }

      // Create a wrapper provider to ensure address doesn't get lost
      const safeProvider = {
        ...this.publicClient,
        getCode: async (params: any) => {
          console.log("Safe provider getCode called with:", params);
          return this.publicClient.getCode({
            address: contractAddress,
          });
        },
        request: async (params: any) => {
          console.log("Safe provider request called with:", params);

          // Fix for Arbitrum Sepolia: ensure parameters are not null
          if (params.params) {
            // For all methods that take an address as first parameter, ensure it's set properly
            const methodsWithAddressFirst = [
              "eth_getCode",
              "eth_getStorageAt",
              "eth_getBalance",
              "eth_getTransactionCount",
              "eth_call",
            ];

            if (methodsWithAddressFirst.includes(params.method)) {
              // If first param is null or undefined, replace with the contract address
              if (params.params[0] === null || params.params[0] === undefined) {
                console.log(`Fixing null address in ${params.method} request`);
                params.params[0] =
                  contractAddress.toLowerCase() as `0x${string}`;
              }

              // For eth_getStorageAt, also ensure second param (slot) is not null
              if (
                params.method === "eth_getStorageAt" &&
                (params.params[1] === null || params.params[1] === undefined)
              ) {
                console.log(`Fixing null slot in ${params.method} request`);
                params.params[1] = "0x0"; // Default to slot 0
              }
            }
          }

          // Handle eth_getStorageAt specially
          if (params.method === "eth_getStorageAt") {
            // Ensure we have a properly formatted address
            const formattedAddress =
              params.params[0] ||
              (contractAddress.toLowerCase() as `0x${string}`);
            const slot = params.params[1] || "0x0";
            const blockTag = params.params[2] || "latest";

            console.log(`Making eth_getStorageAt request with params:`, [
              formattedAddress,
              slot,
              blockTag,
            ]);

            // Make the request with properly formatted parameters
            return this.publicClient.request({
              method: "eth_getStorageAt",
              params: [formattedAddress, slot, blockTag],
            });
          }

          // Handle eth_getCode specially
          if (params.method === "eth_getCode") {
            const formattedAddress =
              params.params[0] ||
              (contractAddress.toLowerCase() as `0x${string}`);
            const blockTag = params.params[1] || "latest";

            console.log(`Making eth_getCode request with params:`, [
              formattedAddress,
              blockTag,
            ]);

            return this.publicClient.request({
              method: "eth_getCode",
              params: [formattedAddress, blockTag],
            });
          }

          // For all other methods, pass through but ensure address is formatted if it's the first parameter
          if (params.params?.[0] === null || params.params?.[0] === undefined) {
            params.params[0] = contractAddress.toLowerCase() as `0x${string}`;
          }

          return this.publicClient.request(params);
        },
      };

      console.log("Created safe provider for address:", contractAddress);

      // Determine if we should enable proxy resolution based on the chain ID
      const shouldFollowProxies = this.shouldEnableProxyResolution(
        this.currentChainId
      );

      if (!shouldFollowProxies) {
        console.log(
          `Proxy resolution via standard method disabled for chain ID ${this.currentChainId}, using manual detection instead`
        );

        // For problematic chains, we'll use a more direct approach to get selectors and basic ABI
        // This won't resolve proxies automatically, but will give us function selectors
        console.log("Getting selectors directly from bytecode");
        const selectors = whatsabi.selectorsFromBytecode(code);
        console.log(
          `Found ${selectors.length} selectors in bytecode:`,
          selectors
        );

        // Get basic ABI structure from bytecode
        console.log("Getting base ABI from bytecode");
        const baseAbi = whatsabi.abiFromBytecode(code);
        console.log(`Base ABI has ${baseAbi.length} items`);

        // Try to lookup function signatures
        const signatureLookup = this.signatureLookup;
        const enhancedAbi = await this.enhanceAbiWithSignatures(
          baseAbi,
          signatureLookup
        );
        console.log(`Enhanced ABI has ${enhancedAbi.length} items`);

        // Try to manually check if it's a proxy by looking for common proxy patterns in selectors
        const proxyImplementation = await this.manuallyCheckForProxy(
          contractAddress,
          safeProvider,
          selectors
        );

        let finalAbi = enhancedAbi;
        let implementationAddress = contractAddress;

        // If we found a proxy implementation, get its ABI
        if (proxyImplementation) {
          console.log(`Found proxy implementation at ${proxyImplementation}`);
          implementationAddress = proxyImplementation as Address;

          try {
            // Get the implementation code
            const implCode = await this.publicClient.getCode({
              address: implementationAddress,
            });

            if (implCode && implCode !== "0x") {
              // Get selectors and ABI from implementation
              const implSelectors = whatsabi.selectorsFromBytecode(implCode);
              console.log(
                `Found ${implSelectors.length} selectors in implementation`
              );

              const implAbi = whatsabi.abiFromBytecode(implCode);
              const enhancedImplAbi = await this.enhanceAbiWithSignatures(
                implAbi,
                signatureLookup
              );

              // Combine proxy functions with implementation functions
              finalAbi = [...enhancedAbi, ...enhancedImplAbi];
            }
          } catch (error) {
            console.error(`Error getting implementation ABI:`, error);
            // Continue with the proxy ABI only
          }
        }

        const result: WhatsABIResult = {
          abi: finalAbi,
          address: implementationAddress,
          selectors: selectors,
          proxy: proxyImplementation
            ? {
                implementation: proxyImplementation,
              }
            : undefined,
        };

        // Cache the result
        this.abiCache.set(cacheKey, result);
        return result;
      }

      // Use standard WhatsABI autoload for chains that support it properly
      console.log("Using WhatsABI autoload for contract resolution");
      try {
        const result = await whatsabi.autoload(contractAddress, {
          provider: safeProvider,
          followProxies: true,
          abiLoader: this.loader,
          signatureLookup: this.signatureLookup,
          onProgress: (phase) => {
            console.log(`WhatsABI progress - ${phase}`);
          },
          onError: (phase, context) => {
            console.error(`WhatsABI error in phase ${phase}:`, context);
          },
        });
        console.log("WhatsABI - autoload returned address:", result.address);

        const whatsAbiResult: WhatsABIResult = {
          abi: result.abi,
          address: result.address as Address,
        };

        // Cache the result
        this.abiCache.set(cacheKey, whatsAbiResult);
        return whatsAbiResult;
      } catch (error) {
        console.error("Error in standard WhatsABI autoload:", error);
        console.log("Falling back to direct bytecode analysis");

        // Fallback to direct bytecode analysis
        const selectors = whatsabi.selectorsFromBytecode(code);
        const baseAbi = whatsabi.abiFromBytecode(code);
        const enhancedAbi = await this.enhanceAbiWithSignatures(
          baseAbi,
          this.signatureLookup
        );

        const result: WhatsABIResult = {
          abi: enhancedAbi,
          address: contractAddress,
          selectors: selectors,
        };

        // Cache the result
        this.abiCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.error("Error parsing contract:", error);
      throw error;
    }
  }

  /**
   * Manually check for proxy patterns in contract
   * This is a fallback for chains where eth_getStorageAt doesn't work properly
   */
  private async manuallyCheckForProxy(
    contractAddress: Address,
    provider: any,
    selectors: string[]
  ): Promise<Address | null> {
    try {
      console.log(`Checking if ${contractAddress} is a proxy contract`);

      // Common implementation slots used by various proxy patterns
      const commonImplementationSlots = [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc", // EIP-1967
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50", // OpenZeppelin TransparentUpgradeableProxy
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3", // EIP-1822 (UUPS)
        "0x0000000000000000000000000000000000000000000000000000000000000000", // Simple proxy slot 0
      ];

      // Check if the contract has common proxy selectors
      const isLikelyProxy = selectors.some((selector) =>
        // Common proxy function selectors
        [
          "0x3659cfe6", // upgradeTo(address)
          "0x4f1ef286", // upgradeToAndCall(address,bytes)
          "0x8f283970", // changeAdmin(address)
          "0xf851a440", // admin()
          "0x5c60da1b", // implementation()
          "0x5a8b35a2", // getImplementation()
          "0xbb913f41", // IMPLEMENTATION_SLOT()
          "0x7050c9e0", // implementation_slot()
        ].includes(selector)
      );

      if (isLikelyProxy) {
        console.log(
          "Contract has proxy-like selectors, checking implementation slots"
        );
      } else {
        console.log(
          "Contract doesn't have obvious proxy selectors, still checking common slots"
        );
      }

      // Check each slot for a potential implementation address
      for (const slot of commonImplementationSlots) {
        try {
          console.log(`Checking implementation slot ${slot}`);
          const storage = await provider.request({
            method: "eth_getStorageAt",
            params: [contractAddress, slot, "latest"],
          });

          if (
            storage &&
            storage !== "0x" &&
            storage !==
              "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            // Convert storage value to address format
            // Storage values are 32 bytes, but we need the last 20 bytes for the address
            const addressStart = storage.length - 40;
            const implementation = "0x" + storage.slice(addressStart);

            // Validate if it looks like an address
            if (isAddress(implementation)) {
              console.log(
                `Found potential implementation at ${implementation}`
              );

              // Check if the address has code
              const code = await provider.request({
                method: "eth_getCode",
                params: [implementation, "latest"],
              });

              if (code && code !== "0x") {
                console.log(
                  `Implementation address ${implementation} has code, confirmed proxy`
                );
                return implementation as Address;
              }
            }
          }
        } catch (error) {
          console.error(`Error checking slot ${slot}:`, error);
          // Continue to next slot
        }
      }

      console.log("No proxy implementation found");
      return null;
    } catch (error) {
      console.error("Error in manuallyCheckForProxy:", error);
      return null;
    }
  }

  /**
   * Enhance ABI with function signatures from a lookup service
   * with improved error handling for lookup failures
   */
  private async enhanceAbiWithSignatures(
    abi: any[],
    signatureLookup: any
  ): Promise<any[]> {
    try {
      const enhancedAbi = [...abi];

      // For each function, try to find its signature
      for (const item of enhancedAbi) {
        if (item.type === "function" && item.selector) {
          try {
            // Try to get the signature with a timeout to avoid hanging
            const signatures = await Promise.race([
              signatureLookup.loadFunctions(item.selector),
              // 3 second timeout to avoid hanging on network issues
              new Promise<string[]>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Signature lookup timeout")),
                  3000
                )
              ),
            ]);

            if (signatures && signatures.length > 0) {
              // Process the signature if found
              await this.processSignature(item, signatures[0]);
            } else {
              // Try direct 4byte API if signatureLookup failed to return any signatures
              await this.tryDirect4ByteApiLookup(item);
            }
          } catch (error) {
            console.error(
              `Error enhancing ABI for selector ${item.selector}:`,
              error
            );

            // Try direct 4byte API as fallback on failure
            try {
              await this.tryDirect4ByteApiLookup(item);
            } catch (fallbackError) {
              // If all else fails, just provide a default name
              if (!item.name) {
                item.name = `func_${item.selector.slice(2)}`;
                item.inputs = item.inputs || [];
                item.outputs = item.outputs || [];
                item.stateMutability = item.stateMutability || "nonpayable";
              }
            }
          }
        }
      }

      return enhancedAbi;
    } catch (error) {
      console.error("Error in enhanceAbiWithSignatures:", error);
      return abi; // Return original ABI on error
    }
  }

  /**
   * Process a function signature to extract name, inputs, and outputs
   */
  private async processSignature(item: any, signature: string): Promise<void> {
    const match = signature.match(/^([^(]+)\(([^)]*)\)(.*)$/);

    if (match) {
      const name = match[1];
      const inputsStr = match[2];
      const outputsStr = match[3];

      // Set the name
      item.name = name;

      // Parse inputs
      if (inputsStr) {
        item.inputs = inputsStr
          .split(",")
          .map((type: string, index: number) => {
            return {
              name: `param${index}`,
              type: type.trim(),
            };
          });
      } else {
        item.inputs = [];
      }

      // Parse outputs if present
      if (outputsStr && outputsStr.includes("returns")) {
        const returnsMatch = outputsStr.match(/returns\s*\(([^)]*)\)/);
        if (returnsMatch) {
          const returnsStr = returnsMatch[1];
          item.outputs = returnsStr
            .split(",")
            .map((type: string, index: number) => {
              return {
                name: `output${index}`,
                type: type.trim(),
              };
            });

          // Assume it's a view function if it has outputs
          item.stateMutability = "view";
        }
      } else {
        item.outputs = [];
        // Default stateMutability if not already set
        if (!item.stateMutability) {
          item.stateMutability = "nonpayable";
        }
      }
    }
  }

  /**
   * Try to lookup function signature directly from 4byte.directory API
   * as a fallback for when the WhatsABI lookup fails
   */
  private async tryDirect4ByteApiLookup(item: any): Promise<void> {
    try {
      // Access the 4byte API directly
      const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${item.selector}`;

      // Use our certificate bypass method for consistency
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Fetch with timeout and certificate bypass
      let response;
      try {
        response = await Promise.race([
          this.fetchWithCertBypass(url),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Fetch timeout")), 2000)
          ),
        ]);
      } catch (fetchError) {
        console.warn("4byte fetch error:", fetchError);
        throw new Error("4byte API request failed");
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Sort by popularity (highest ID first is usually most popular)
          const sortedResults = [...data.results].sort(
            (a: any, b: any) => b.id - a.id
          );
          const signature = sortedResults[0].text_signature;

          if (signature) {
            console.log(`Found signature from 4byte API: ${signature}`);
            await this.processSignature(item, signature);
            return;
          }
        }
      }

      // If we get here, we couldn't find the signature
      if (!item.name) {
        item.name = `func_${item.selector.slice(2)}`;
        item.inputs = [];
        item.outputs = [];
        item.stateMutability = "nonpayable";
      }
    } catch (error) {
      console.error(
        `Direct 4byte API lookup failed for ${item.selector}:`,
        error
      );
      // Just provide a default name if everything fails
      if (!item.name) {
        item.name = `func_${item.selector.slice(2)}`;
        item.inputs = item.inputs || [];
        item.outputs = item.outputs || [];
        item.stateMutability = item.stateMutability || "nonpayable";
      }
    }
  }

  private async getFunctionFromABI(
    abi: any[],
    params: ContractCallParams
  ): Promise<any> {
    const functions = abi.filter((item) => item.type === "function");

    let foundFunction;
    if (params.sighash) {
      // If sighash is provided, find function by its selector
      foundFunction = functions.find(
        (f) =>
          this.getFunctionSighash(
            this.getFunctionSignature(f.name, f.inputs)
          ) === params.sighash
      );
    } else if (params.signature) {
      // If signature is provided, find function by its full signature
      foundFunction = functions.find(
        (f) => this.getFunctionSignature(f.name, f.inputs) === params.signature
      );
    } else {
      // If only name is provided and there are overloaded functions, try to match by args length
      const matchingFuncs = functions.filter(
        (f) => f.name === params.functionName
      );
      if (matchingFuncs.length > 1) {
        // Try to match by number of arguments
        const argsLength = params.args?.length || 0;
        const matchByArgs = matchingFuncs.filter(
          (f) => (f.inputs || []).length === argsLength
        );
        if (matchByArgs.length === 1) {
          foundFunction = matchByArgs[0];
        } else {
          throw new Error(
            `Multiple functions named "${params.functionName}" found. Please provide signature or sighash to specify which one.`
          );
        }
      } else {
        foundFunction = matchingFuncs[0];
      }
    }

    // If function is found but missing outputs, try to get signature from OpenChain
    if (
      foundFunction &&
      (!foundFunction.outputs || foundFunction.outputs.length === 0)
    ) {
      try {
        const openChainLookup = new whatsabi.loaders.OpenChainSignatureLookup();
        if (foundFunction.selector) {
          const signatures = await openChainLookup.loadFunctions(
            foundFunction.selector
          );
          if (signatures && signatures.length > 0) {
            // Parse the signature to get outputs
            const fullSig = signatures[0];
            const returnMatch = fullSig.match(/\)(.*?)$/);
            if (returnMatch && returnMatch[1]) {
              const returnPart = returnMatch[1].trim();
              if (returnPart.startsWith("returns")) {
                // Handle explicit 'returns' keyword
                const types = returnPart
                  .replace("returns", "")
                  .trim()
                  .replace(/[()]/g, "")
                  .split(",");
                foundFunction.outputs = types
                  .filter(Boolean)
                  .map((type: string, index: number) => ({
                    name: `output${index}`,
                    type: type.trim(),
                  }));
                foundFunction.stateMutability = "view"; // Most likely view if it has outputs
              } else if (returnPart.startsWith("(")) {
                // Handle direct return types
                const types = returnPart.replace(/[()]/g, "").split(",");
                foundFunction.outputs = types
                  .filter(Boolean)
                  .map((type: string, index: number) => ({
                    name: `output${index}`,
                    type: type.trim(),
                  }));
                foundFunction.stateMutability = "view"; // Most likely view if it has outputs
              }
            }
          }
        }
      } catch (error) {
        console.log("OpenChain lookup failed, trying ERC20 fallback:", error);
      }

      // If still no outputs, try ERC20 fallback
      if (!foundFunction.outputs || foundFunction.outputs.length === 0) {
        const erc20Func = FALLBACK_ERC20_ABI.find(
          (item) => item.type === "function" && item.name === foundFunction.name
        );
        if (erc20Func && "inputs" in erc20Func) {
          // Check if inputs match
          const inputsMatch =
            !foundFunction.inputs ||
            (foundFunction.inputs.length === erc20Func.inputs.length &&
              foundFunction.inputs.every(
                (input: any, index: number) =>
                  input.type === erc20Func.inputs[index].type
              ));

          if (inputsMatch && "outputs" in erc20Func) {
            foundFunction.outputs = erc20Func.outputs;
            foundFunction.stateMutability = erc20Func.stateMutability;
          }
        }
      }
    }

    return foundFunction;
  }

  /**
   * Make a read call to the contract
   */
  async readContract(
    contractAddress: Address,
    params: ContractCallParams
  ): Promise<any> {
    try {
      console.log(
        "WhatsABI - readContract called with address:",
        contractAddress
      );

      // First parse the contract
      console.log(
        "WhatsABI - About to call parseContract with address:",
        contractAddress
      );
      const { abi, address } = await this.parseContract(contractAddress);
      console.log("WhatsABI - parseContract returned address:", address);

      // Find the specific function
      const func = await this.getFunctionFromABI(abi, params);
      if (!func) {
        throw new Error(
          `Function ${params.functionName} not found in contract ABI`
        );
      }

      // Make the read call
      console.log(
        "WhatsABI - About to call publicClient.readContract with address:",
        address
      );
      const result = await this.publicClient.readContract({
        address,
        abi: [func],
        functionName: func.name,
        args: params.args || [],
      });
      console.log(
        "WhatsABI - publicClient.readContract completed successfully"
      );

      // Convert BigInt values to strings for JSON serialization
      return this.serializeBigInt(result);
    } catch (error) {
      console.error("Error reading contract:", error);
      throw error;
    }
  }

  /**
   * Prepare a write transaction to the contract (transaction data only)
   */
  async prepareWriteContract(
    contractAddress: Address,
    params: ContractCallParams
  ): Promise<any> {
    try {
      // First parse the contract
      const { abi, address } = await this.parseContract(contractAddress);

      // Find the specific function
      const func = await this.getFunctionFromABI(abi, params);
      if (!func) {
        throw new Error(
          `Function ${params.functionName} not found in contract ABI`
        );
      }

      if (func.stateMutability === "view" || func.stateMutability === "pure") {
        throw new Error(
          `Function ${params.functionName} is a read-only function and cannot be written to`
        );
      }

      // Return the transaction data
      return {
        address,
        abi: [func],
        functionName: func.name,
        args: params.args || [],
      };
    } catch (error) {
      console.error("Error preparing write contract:", error);
      throw error;
    }
  }

  // Helper method to serialize BigInt values
  private serializeBigInt(value: any): any {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serializeBigInt(item));
    }

    if (typeof value === "object" && value !== null) {
      const serialized: any = {};
      for (const [key, val] of Object.entries(value)) {
        serialized[key] = this.serializeBigInt(val);
      }
      return serialized;
    }

    return value;
  }

  private getFunctionSignature(
    name: string,
    inputs: Array<{ type: string }>
  ): string {
    return `${name}(${inputs.map((input) => input.type).join(",")})`;
  }

  private getFunctionSighash(signature: string): string {
    // For server-side compatibility
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(signature);
      return this.keccak256(data).slice(0, 10); // Return first 4 bytes + '0x'
    } catch (error) {
      console.error("Error calculating function sighash:", error);
      return "";
    }
  }

  private keccak256(data: Uint8Array): string {
    // In a real implementation, use a proper keccak256 library
    // This is just a placeholder that would need to be replaced with an actual implementation
    try {
      // In a real app, use ethers or viem's keccak256
      const hash = Array.from(data)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return "0x" + hash;
    } catch (error) {
      console.error("Error calculating keccak256:", error);
      return "0x";
    }
  }

  /**
   * Get all available functions from contract with their arguments and signatures
   */
  async getContractFunctions(
    contractAddress: Address
  ): Promise<ContractFunction[]> {
    try {
      console.log(
        `WhatsABI getContractFunctions called for address: ${contractAddress} on chain ${this.currentChainId}`
      );

      // Validate address
      if (!contractAddress || !isAddress(contractAddress)) {
        console.error(`Invalid address: ${contractAddress}`);
        throw new Error(`Invalid address: ${contractAddress}`);
      }

      const formattedAddress = getAddress(contractAddress) as Address;
      console.log(`Formatted address: ${formattedAddress}`);

      console.log(
        `Checking if contract exists for ${formattedAddress} on chain ${this.currentChainId}`
      );
      const bytecode = await this.publicClient.getCode({
        address: formattedAddress,
      });

      // Check if it's a contract
      if (!bytecode || bytecode === "0x") {
        console.error(`No bytecode found at address ${formattedAddress}`);
        throw new Error(`No contract found at address ${formattedAddress}`);
      }
      console.log(`Bytecode found with length: ${bytecode.length}`);

      // Get WhatsABI result with events and functions
      console.log(`Getting WhatsABI result for ${formattedAddress}`);
      const result = await this.parseContract(formattedAddress);
      console.log(`WhatsABI result obtained`);

      const { abi } = result;
      console.log(`ABI obtained with ${abi.length} items`);

      // Convert ABI to ContractFunction schema
      console.log(`Converting ABI to Contract Functions`);
      const functions = this.processABI(abi);
      console.log(`Found ${functions.length} functions`);

      return functions;
    } catch (error) {
      console.error("Error in getContractFunctions:", error);
      throw error;
    }
  }

  /**
   * Process ABI to return ContractFunction array
   */
  private processABI(abi: any[]): ContractFunction[] {
    // Process each function
    return abi
      .filter((item: any) => item.type === "function")
      .map((func: any) => {
        // If function is missing outputs, check fallback ERC20 ABI
        if (!func.outputs || func.outputs.length === 0) {
          const erc20Func = FALLBACK_ERC20_ABI.find(
            (item) => item.type === "function" && item.name === func.name
          );
          if (erc20Func && "inputs" in erc20Func) {
            // Check if inputs match
            const inputsMatch =
              !func.inputs ||
              (func.inputs.length === erc20Func.inputs.length &&
                func.inputs.every(
                  (input: any, index: number) =>
                    input.type === erc20Func.inputs[index].type
                ));

            if (inputsMatch && "outputs" in erc20Func) {
              func.outputs = erc20Func.outputs;
              func.stateMutability = erc20Func.stateMutability;
            }
          }
        }

        return {
          name: func.name,
          signature:
            func.sig ||
            `${func.name}(${(func.inputs || [])
              .map((i: any) => i.type)
              .join(",")})`,
          sighash: func.selector,
          inputs: (func.inputs || []).map((input: any, index: number) => ({
            name: input.name || `param${input.type}`,
            type: input.type,
          })),
          outputs: (func.outputs || []).map((output: any, index: number) => ({
            name: output.name || `output${index}`,
            type: output.type,
          })),
          stateMutability: func.stateMutability || "nonpayable",
        };
      });
  }

  /**
   * Get all available events from contract
   */
  async getContractEvents(contractAddress: Address): Promise<string[]> {
    try {
      const { abi } = await this.parseContract(contractAddress);
      return abi
        .filter((item: any) => item.type === "event")
        .map((event: any) => event.name);
    } catch (error) {
      console.error("Error getting contract events:", error);
      throw error;
    }
  }

  /**
   * Check if contract implements specific interface
   */
  async hasFunction(
    contractAddress: Address,
    functionName: string
  ): Promise<boolean> {
    try {
      const functions = await this.getContractFunctions(contractAddress);
      return functions.some((func) => func.name === functionName);
    } catch (error) {
      console.error("Error checking function existence:", error);
      throw error;
    }
  }

  /**
   * Get cached ABI or parse new one
   */
  async getCachedABI(contractAddress: Address): Promise<WhatsABIResult> {
    const cached = this.abiCache.get(contractAddress.toLowerCase());
    if (cached) {
      return cached;
    }

    const result = await this.parseContract(contractAddress);
    this.abiCache.set(contractAddress.toLowerCase(), result);
    return result;
  }

  /**
   * Clear ABI cache
   */
  clearCache(): void {
    this.abiCache.clear();
  }

  /**
   * Get specific contract functions by name
   */
  async getSpecificContractFunctions(
    contractAddress: Address,
    functionNames: string[]
  ): Promise<ContractFunction[]> {
    try {
      const allFunctions = await this.getContractFunctions(contractAddress);

      // Filter functions by name
      const filteredFunctions = allFunctions.filter((func) =>
        functionNames.includes(func.name)
      );

      if (filteredFunctions.length < functionNames.length) {
        const foundNames = filteredFunctions.map((f) => f.name);
        const missingNames = functionNames.filter(
          (name) => !foundNames.includes(name)
        );
        console.warn(
          `Some requested functions were not found: ${missingNames.join(", ")}`
        );
      }

      return filteredFunctions;
    } catch (error) {
      console.error("Error getting specific contract functions:", error);
      throw error;
    }
  }

  /**
   * Format ABI in a human-readable way
   */
  formatABI(abi: any[]): string {
    try {
      return JSON.stringify(abi, null, 2);
    } catch (error) {
      console.error("Error formatting ABI:", error);
      return JSON.stringify(abi);
    }
  }

  /**
   * Get contract ABI as formatted JSON
   */
  async getFormattedABI(contractAddress: Address): Promise<string> {
    const { abi } = await this.parseContract(contractAddress);
    return this.formatABI(abi);
  }
}