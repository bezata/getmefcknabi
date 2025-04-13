export declare function hexToBytes(hex: string): Uint8Array;
export declare function bytesToHex(bytes: Uint8Array | Number, padToBytes?: number): string;
export declare function keccak256(data: Uint8Array | string): string;
export declare function fetchJSON(url: string): Promise<any>;
export declare function addressWithChecksum(address: string): string;
