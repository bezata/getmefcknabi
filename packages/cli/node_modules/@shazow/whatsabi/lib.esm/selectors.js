import { FunctionFragment } from "ethers";
import { keccak256 } from "./utils.js";
import { disasm } from "./disasm.js";
// Load function selectors mapping from ABI, parsed using ethers.js
// Mapping is selector hash to signature
export function selectorsFromABI(abi) {
    const r = {};
    for (const el of abi) {
        if (typeof (el) !== "string" && el.type !== "function")
            continue;
        const f = FunctionFragment.from(el).format();
        r[keccak256(f).substring(0, 10)] = f;
    }
    return r;
}
// Load function selectors from EVM bytecode by parsing JUMPI instructions
export function selectorsFromBytecode(code) {
    const p = disasm(code, { onlyJumpTable: true });
    return Object.keys(p.selectors);
}
//# sourceMappingURL=selectors.js.map