import {
  type Address,
  type PublicClient,
  createPublicClient,
  http,
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

export interface WhatsABIResult {
  abi: any[];
  name?: string;
  address: Address;
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
  sighash: string;
  inputs: Array<{
    name: string;
    type: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
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

  constructor(
    private publicClient: PublicClient,
    config?: {
      etherscanApiKey?: string;
      chainId?: number;
    }
  ) {
    this.currentChainId = config?.chainId || 1; // Default to mainnet
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
    this.signatureLookup = new MultiSignatureLookup([
      // 4byte directory
      new FourByteSignatureLookup(),
      // OpenChain (formerly Samczsun)
      new OpenChainSignatureLookup(),
    ]);
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

      // Get the bytecode
      console.log("WhatsABI - About to get code for address:", contractAddress);
      const code = await this.publicClient.getCode({
        address: contractAddress,
      });

      console.log("WhatsABI - getCode result length:", code?.length);
      if (!code || code === "0x") {
        throw new Error("No bytecode found for contract");
      }

      // Parse using WhatsABI with loaders
      console.log(
        "WhatsABI - About to call autoload with address:",
        contractAddress
      );

      // Create a wrapper provider to ensure address doesn't get lost
      const safeProvider = {
        ...this.publicClient,
        getCode: async (params: any) => {
          console.log("Safe provider getCode called with:", params);
          // Ensure address is always set
          return this.publicClient.getCode({
            address: contractAddress,
          });
        },
      };

      const result = await whatsabi.autoload(contractAddress, {
        provider: safeProvider,
        followProxies: true,
        abiLoader: this.loader,
        signatureLookup: this.signatureLookup,
      });
      console.log("WhatsABI - autoload returned address:", result.address);

      return {
        abi: result.abi,
        address: result.address as Address,
      };
    } catch (error) {
      console.error("Error parsing contract:", error);
      throw error;
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
      const { abi } = await this.parseContract(contractAddress);

      // Process each function
      const functions = abi
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

      return functions;
    } catch (error) {
      console.error("Error getting contract functions:", error);
      throw error;
    }
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
