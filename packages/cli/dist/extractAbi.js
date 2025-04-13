import { createPublicClient, http } from "viem";
import * as whatsabi from "@shazow/whatsabi";
import { chains } from "./chains.js";
/**
 * Extract ABI and functions from a contract
 */
export async function extractAbi(address, rpcUrl, chainId = 1) {
    try {
        // Create a viem client
        const publicClient = createPublicClient({
            transport: http(rpcUrl),
        });
        // Get chain config for block explorer
        const blockExplorerUrl = getEtherscanBaseUrl(chainId);
        // Normalize address
        const contractAddress = address.toLowerCase();
        // Get contract bytecode
        const bytecode = await publicClient.getBytecode({
            address: contractAddress,
        });
        if (!bytecode || bytecode === "0x") {
            throw new Error(`No bytecode found for contract at ${address} on chain ${chainId}`);
        }
        // First try autoload which will check verified sources
        console.log("Attempting to load ABI from block explorer...");
        try {
            const result = await whatsabi.autoload(address, {
                provider: publicClient,
                followProxies: true,
            });
            if (result && result.abi && result.abi.length > 0) {
                // Process ABI items for output
                const processedAbi = processAbiForOutput(result.abi);
                return {
                    abi: processedAbi,
                    functions: extractFunctionsFromAbi(processedAbi),
                    source: "block-explorer",
                };
            }
        }
        catch (error) {
            console.log("Error loading from block explorer, falling back to bytecode analysis");
        }
        // Fallback to bytecode analysis
        console.log("Analyzing bytecode...");
        // Extract selectors from bytecode
        const selectors = whatsabi.selectorsFromBytecode(bytecode);
        if (!selectors || selectors.length === 0) {
            throw new Error(`No function selectors found in bytecode for ${address}`);
        }
        console.log(`Found ${selectors.length} selectors in bytecode`);
        // Get ABI from bytecode
        let abi = whatsabi.abiFromBytecode(bytecode);
        // Process ABI items for output
        const processedAbi = processAbiForOutput(abi);
        const functions = extractFunctionsFromAbi(processedAbi);
        return {
            abi: processedAbi,
            functions,
            source: "bytecode-analysis",
        };
    }
    catch (error) {
        console.error(`Error extracting ABI: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
/**
 * Process ABI items for output
 */
function processAbiForOutput(abi) {
    return abi.map((item) => {
        const result = {
            type: item.type,
        };
        if (item.name)
            result.name = item.name;
        if (item.inputs)
            result.inputs = item.inputs;
        if (item.outputs)
            result.outputs = item.outputs;
        if (item.stateMutability)
            result.stateMutability = item.stateMutability;
        if (item.anonymous !== undefined)
            result.anonymous = item.anonymous;
        return result;
    });
}
/**
 * Extract functions from ABI
 */
function extractFunctionsFromAbi(abi) {
    return abi
        .filter((item) => item.type === "function")
        .map((item) => ({
        name: item.name,
        signature: getFunctionSignature(item),
        inputs: item.inputs || [],
        outputs: item.outputs || [],
        stateMutability: item.stateMutability || "nonpayable",
    }));
}
/**
 * Get function signature from ABI item
 */
function getFunctionSignature(item) {
    if (!item.name)
        return "";
    const inputs = item.inputs || [];
    const types = inputs.map((input) => input.type).join(",");
    return `${item.name}(${types})`;
}
/**
 * Get the Etherscan API base URL for a given chain ID
 */
function getEtherscanBaseUrl(chainId) {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain || !chain.blockExplorerUrl) {
        return "https://api.etherscan.io";
    }
    // Handle different explorer URLs
    const url = chain.blockExplorerUrl;
    if (url.includes("etherscan.io")) {
        return url.replace("https://", "https://api.");
    }
    if (url.includes("polygonscan.com")) {
        return url.replace("https://", "https://api.");
    }
    if (url.includes("bscscan.com")) {
        return url.replace("https://", "https://api.");
    }
    if (url.includes("arbiscan.io")) {
        return url.replace("https://", "https://api.");
    }
    if (url.includes("optimistic.etherscan.io")) {
        return "https://api-optimistic.etherscan.io";
    }
    if (url.includes("basescan.org")) {
        return url.replace("https://", "https://api.");
    }
    // Default to API subdomain
    return url.replace("https://", "https://api.");
}
