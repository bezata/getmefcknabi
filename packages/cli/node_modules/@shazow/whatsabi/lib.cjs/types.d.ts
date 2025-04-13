export interface StorageProvider {
    getStorageAt(address: string, slot: number | string): Promise<string>;
}
export interface CallProvider {
    call(transaction: {
        to: string;
        data: string;
    }): Promise<string>;
}
export interface CodeProvider {
    getCode(address: string): Promise<string>;
}
export interface ENSProvider {
    getAddress(name: string): Promise<string>;
}
export interface Provider extends StorageProvider, CallProvider, CodeProvider, ENSProvider {
}
export interface AnyProvider {
}
export declare function CompatibleProvider(provider: any): Provider;
