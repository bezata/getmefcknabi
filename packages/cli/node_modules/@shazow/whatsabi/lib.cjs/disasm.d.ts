import type { ABI } from "./abi.js";
import type { OpCode } from "./opcodes.js";
import type { ProxyResolver } from "./proxies.js";
export declare class BytecodeIter {
    bytecode: Uint8Array;
    nextStep: number;
    nextPos: number;
    posBuffer: number[];
    posBufferSize: number;
    constructor(bytecode: string, config?: {
        bufferSize?: number;
    });
    hasMore(): boolean;
    next(): OpCode;
    step(): number;
    pos(): number;
    asPos(posOrRelativeStep: number): number;
    at(posOrRelativeStep: number): OpCode;
    value(): Uint8Array;
    valueAt(posOrRelativeStep: number): Uint8Array;
}
export declare class Function {
    byteOffset: number;
    opTags: Set<OpCode>;
    start: number;
    jumps: Array<number>;
    end?: number;
    constructor(byteOffset?: number, start?: number);
}
export declare class Program {
    dests: {
        [key: number]: Function;
    };
    selectors: {
        [key: string]: number;
    };
    notPayable: {
        [key: number]: number;
    };
    fallback?: number;
    eventCandidates: Array<string>;
    proxySlots: Array<string>;
    proxies: Array<ProxyResolver>;
    init?: Program;
    constructor(init?: Program);
}
export declare function abiFromBytecode(bytecodeOrProgram: string | Program): ABI;
export declare function disasm(bytecode: string, config?: {
    onlyJumpTable: boolean;
}): Program;
