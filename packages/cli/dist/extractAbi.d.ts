/**
 * Extract ABI and functions from a contract
 */
export declare function extractAbi(address: string, rpcUrl: string, chainId?: number): Promise<{
    abi: any[];
    functions: any[];
    source: string;
}>;
