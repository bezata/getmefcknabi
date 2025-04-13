import { keccak256 } from "./utils.js";
export function joinSlot(parts) {
    return keccak256("0x" + parts.map(s => {
        if (s.startsWith("0x")) {
            s = s.slice(2);
        }
        return s.padStart(64, "0");
    }).join(""));
}
export function addSlotOffset(slot, offset) {
    return "0x" + (BigInt(slot) + BigInt(offset)).toString(16);
}
/**
 * Read an array at some slot
 * @param {StorageProvider} provider - Implementation of a provider that can call getStorageAt
 * @param {string} address - Address of the contract storage namespace
 * @param {number|string} pos - Slot position of the array
 * @param {number=} width - Array item size, in bytes
 * @returns {Promise<string[]>} Values of the array at the given slot
 */
export async function readArray(provider, address, pos, width = 32) {
    // Based on https://gist.github.com/banteg/0cee21909f7c1baedfa6c3d96ffe94f2
    const num = Number(await provider.getStorageAt(address, pos));
    const start = keccak256(pos.toString(16)); // toString(16) does the right thing on strings too (no-op) (:
    const itemsPerWord = Math.floor(32 / width);
    const promises = [];
    for (let i = 0; i < num; i++) {
        const itemSlot = addSlotOffset(start, Math.floor(i / itemsPerWord));
        promises.push(provider.getStorageAt(address, itemSlot));
    }
    const words = await Promise.all(promises);
    return words.map((wordHex, i) => {
        // TODO: Extract multiple words if they fit in a slot?
        const itemOffset = 2 + 64 - (i % itemsPerWord + 1) * width * 2; // 0x + 2 hex per byte
        return wordHex.slice(itemOffset, itemOffset + width * 2);
    });
}
//# sourceMappingURL=slots.js.map