import type { AnyProvider } from "./types.js";
import type { ABI } from "./abi.js";
import { type ProxyResolver } from "./proxies.js";
import type { ABILoader, SignatureLookup } from "./loaders.js";
export declare const defaultConfig: {
    onProgress: (_: string) => void;
    onError: (phase: string, err: Error) => boolean;
};
export type AutoloadResult = {
    address: string;
    abi: ABI;
    proxies: ProxyResolver[];
    followProxies?: (selector?: string) => Promise<AutoloadResult>;
};
export type AutoloadConfig = {
    provider: AnyProvider;
    abiLoader?: ABILoader | false;
    signatureLookup?: SignatureLookup | false;
    onProgress?: (phase: string, ...args: any[]) => void;
    onError?: (phase: string, error: Error) => boolean | void;
    addressResolver?: (name: string) => Promise<string>;
    followProxies?: boolean;
    enableExperimentalMetadata?: boolean;
};
export declare function autoload(address: string, config: AutoloadConfig): Promise<AutoloadResult>;
