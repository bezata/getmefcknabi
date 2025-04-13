type AbiItem = {
    type: string;
    name?: string;
    inputs?: Array<{
        name: string;
        type: string;
        components?: any[];
        internalType?: string;
    }>;
    outputs?: Array<{
        name: string;
        type: string;
        components?: any[];
        internalType?: string;
    }>;
    stateMutability?: string;
    anonymous?: boolean;
    constant?: boolean;
    payable?: boolean;
};
/**
 * Format utilities for ABI output
 */
export declare const formatters: {
    /**
     * Format ABI as JSON
     */
    formatJson(abi: AbiItem[]): string;
    /**
     * Format ABI as TypeScript constant
     */
    formatTypescript(abi: AbiItem[], address: string): string;
};
export {};
