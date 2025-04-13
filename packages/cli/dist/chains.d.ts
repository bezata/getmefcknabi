/**
 * Chain configuration type
 */
export interface ChainConfig {
    id: number;
    name: string;
    rpcUrl: string;
    blockExplorerUrl?: string;
    isTestnet?: boolean;
}
/**
 * List of supported chains with public RPC URLs
 */
export declare const chains: ChainConfig[];
