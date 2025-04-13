import type { StorageProvider, CallProvider } from "./types.js";
export interface ProxyResolver {
    resolve(provider: StorageProvider | CallProvider, address: string, selector?: string): Promise<string>;
    toString(): string;
}
export declare class BaseProxyResolver {
    name: string;
    constructor(name?: string);
    toString(): string;
}
export declare class GnosisSafeProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class LegacyUpgradeableProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class EIP1967ProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider & CallProvider, address: string): Promise<string>;
}
export declare class DiamondProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider & CallProvider, address: string, selector: string): Promise<string>;
    facets(provider: StorageProvider, address: string): Promise<Record<string, string[]>>;
    selectors(provider: StorageProvider, address: string): Promise<string[]>;
}
export declare class ZeppelinOSProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class PROXIABLEProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class SequenceWalletProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
    toString(): string;
}
export declare class FixedProxyResolver extends BaseProxyResolver implements ProxyResolver {
    readonly resolvedAddress: string;
    constructor(name: string, resolvedAddress: string);
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare const slots: Record<string, string>;
export declare const slotResolvers: Record<string, ProxyResolver>;
