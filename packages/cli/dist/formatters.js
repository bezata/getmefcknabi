/**
 * Format utilities for ABI output
 */
export const formatters = {
    /**
     * Format ABI as JSON
     */
    formatJson(abi) {
        return JSON.stringify(abi, null, 2);
    },
    /**
     * Format ABI as TypeScript constant
     */
    formatTypescript(abi, address) {
        const contractName = address.substring(0, 6).toLowerCase();
        // Clean contract name to be a valid TS identifier
        const cleanName = `Contract${contractName.replace(/[^a-z0-9]/g, "")}`;
        return (`// ABI for contract at ${address}\n` +
            `export const ${cleanName}ABI = ${JSON.stringify(abi, null, 2)} as const;\n\n` +
            `// Use with your favorite library\n` +
            `// Example with viem:\n` +
            `// import { createPublicClient, http } from 'viem';\n` +
            `// const client = createPublicClient({ chain, transport: http() });\n` +
            `// const contract = getContract({\n` +
            `//   address: '${address}',\n` +
            `//   abi: ${cleanName}ABI,\n` +
            `//   publicClient: client,\n` +
            `// });\n`);
    },
};
