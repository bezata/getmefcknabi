export type ContractResult = {
    abi: any[];
    name: string | null;
    evmVersion: string;
    compilerVersion: string;
    runs: number;
    ok: boolean;
};
export interface ABILoader {
    loadABI(address: string): Promise<any[]>;
    getContract(address: string): Promise<ContractResult>;
}
export declare class MultiABILoader implements ABILoader {
    loaders: ABILoader[];
    constructor(loaders: ABILoader[]);
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class EtherscanABILoader implements ABILoader {
    apiKey?: string;
    baseURL: string;
    constructor(config?: {
        apiKey?: string;
        baseURL?: string;
    });
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class SourcifyABILoader implements ABILoader {
    chainId?: number;
    constructor(config?: {
        chainId?: number;
    });
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export interface SignatureLookup {
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class MultiSignatureLookup implements SignatureLookup {
    lookups: SignatureLookup[];
    constructor(lookups: SignatureLookup[]);
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class FourByteSignatureLookup implements SignatureLookup {
    load(url: string): Promise<string[]>;
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class OpenChainSignatureLookup implements SignatureLookup {
    load(url: string): Promise<any>;
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class SamczunSignatureLookup extends OpenChainSignatureLookup {
}
export declare const defaultABILoader: ABILoader;
export declare const defaultSignatureLookup: SignatureLookup;
type LoaderEnv = {
    ETHERSCAN_API_KEY?: string;
    ETHERSCAN_BASE_URL?: string;
    SOURCIFY_CHAIN_ID?: string | number;
};
/** @deprecated Use defaultsWithEnv instead, this function is outdated and will be removed soon. */
export declare function defaultsWithAPIKeys(apiKeys: LoaderEnv): Record<string, ABILoader | SignatureLookup>;
/**
 * Return params to use with whatsabi.autoload(...)
 *
 * @example
 * ```ts
 * whatsabi.autoload(address, {provider, ...defaultsWithEnv(process.env)})
 * ```
 *
 * @example
 * ```ts
 * whatsabi.autoload(address, {
 *   provider,
 *   ...defaultsWithEnv({
 *     SOURCIFY_CHAIN_ID: 42161,
 *     ETHERSCAN_BASE_URL: "https://api.arbiscan.io/api",
 *     ETHERSCAN_API_KEY: "MYSECRETAPIKEY",
 *   }),
 * })
 * ```
 */
export declare function defaultsWithEnv(env: LoaderEnv): Record<string, ABILoader | SignatureLookup>;
export {};
