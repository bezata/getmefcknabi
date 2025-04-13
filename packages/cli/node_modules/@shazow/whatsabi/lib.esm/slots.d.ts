import type { StorageProvider } from "./types.js";
export declare function joinSlot(parts: string[]): string;
export declare function addSlotOffset(slot: string, offset: number): string;
/**
 * Read an array at some slot
 * @param {StorageProvider} provider - Implementation of a provider that can call getStorageAt
 * @param {string} address - Address of the contract storage namespace
 * @param {number|string} pos - Slot position of the array
 * @param {number=} width - Array item size, in bytes
 * @returns {Promise<string[]>} Values of the array at the given slot
 */
export declare function readArray(provider: StorageProvider, address: string, pos: number | string, width?: number): Promise<string[]>;
