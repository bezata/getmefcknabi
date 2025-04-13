"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContractForm from "./components/ContractForm";
import ContractFunctions from "./components/ContractFunctions";
import ContractABI from "./components/ContractABI";
import { ContractFunction } from "./lib/whatsabi";
import DonationModal from "./components/DonationModal";

export default function Home() {
  const router = useRouter();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(1);
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"functions" | "abi">("functions");
  const [isBlinking, setIsBlinking] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const handleContractSubmit = async (
    address: string,
    selectedChainId: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call API to get contract functions
      const response = await fetch(
        `/api/contract/functions?address=${address}&chainId=${selectedChainId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load contract functions");
      }

      setContractAddress(address);
      setChainId(selectedChainId);
      setFunctions(data.functions);
    } catch (err: any) {
      console.error("Error loading contract:", err);
      setError(err.message || "Failed to load contract");
      setFunctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create blinking effect for the emoji
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-purple-800">
      <header className="absolute top-0 right-0 p-4">
        <button
          onClick={() => setShowDonationModal(true)}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 flex items-center transition-all hover:scale-105"
        >
          <span className="mr-2">💰</span>
          <span>Donate</span>
        </button>
      </header>

      <div className="text-center max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col items-center">
          <div
            className="text-8xl mb-4 transition-opacity duration-300"
            style={{ opacity: isBlinking ? 1 : 0.3 }}
          >
            🔥
          </div>
          <h1 className="text-6xl font-extrabold text-white mb-6 tracking-tight">
            get<span className="text-yellow-300">me</span>fcknabi
          </h1>

          {/* Main headline */}
          <div className="bg-black/40 backdrop-blur-sm px-8 py-4 rounded-full mb-6">
            <p className="text-2xl text-white font-bold">
              <span className="text-yellow-300">Unverified contracts?</span> No
              problem.
            </p>
          </div>

          <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl">
            Stop wasting time hunting down ABIs. We decompile smart contract{" "}
            <span className="text-yellow-300 font-bold">bytecode</span> to
            generate the ABI you need, instantly -{" "}
            <span className="underline decoration-yellow-300">
              even when contracts are unverified on Etherscan
            </span>
            .
          </p>

          {/* How it works section */}
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/20 mb-10 max-w-3xl">
            <h2 className="text-white font-bold text-xl mb-3">How it works:</h2>
            <ul className="text-left text-white/90 space-y-2 mb-4">
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">1.</span>
                <span>
                  We extract the{" "}
                  <span className="font-mono text-yellow-300">
                    4byte function selectors
                  </span>{" "}
                  from the contract bytecode
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">2.</span>
                <span>
                  Match these selectors against known function signatures using{" "}
                  <span className="font-mono text-yellow-300">keccak256</span>
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">3.</span>
                <span>
                  Look up proxy implementations and follow{" "}
                  <span className="font-mono text-yellow-300">
                    DELEGATECALL
                  </span>{" "}
                  patterns
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">4.</span>
                <span>
                  Construct a working ABI that's compatible with{" "}
                  <span className="font-mono text-yellow-300">wagmi</span> and{" "}
                  <span className="font-mono text-yellow-300">viem</span>
                </span>
              </li>
            </ul>

            <div className="text-white/80 text-sm border-t border-white/10 pt-3 mt-3">
              <p>
                Powered by{" "}
                <a
                  href="https://github.com/shazow/whatsabi"
                  target="_blank"
                  rel="noopener"
                  className="text-yellow-300 underline hover:text-yellow-400 transition-colors"
                >
                  @shazow's WhatsABI
                </a>{" "}
                - the genius library that makes this all possible. Works even
                when Etherscan verification fails you.
              </p>
            </div>
          </div>

          {/* Unverified contracts callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-3xl w-full">
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                The Etherscan Problem
              </h3>
              <p className="text-white/80 text-left">
                Over 30% of contracts on mainnet are{" "}
                <span className="text-red-400 font-bold">unverified</span>. This
                means you can't see their source code or ABI. If you want to
                interact with them, you're stuck.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                <span className="text-green-400 mr-2">✅</span>
                Our Solution
              </h3>
              <p className="text-white/80 text-left">
                We analyze the{" "}
                <span className="text-yellow-300">raw bytecode</span> directly
                from the blockchain to reconstruct the ABI. No verification
                needed. Works with any EVM chain.
              </p>
            </div>
          </div>

          {/* Example */}
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/20 mb-10 max-w-3xl w-full">
            <h3 className="text-white font-bold text-lg mb-4">
              See it in action:
            </h3>
            <div className="mb-4 p-3 bg-black/50 rounded-lg border border-white/10">
              <p className="font-mono text-xs text-white/80 text-left overflow-x-auto whitespace-nowrap">
                <span className="text-yellow-300">➜</span> Contract
                0x1F98431c8aD98523631AE4a59f267346ea31F984
                <span className="text-red-400"> [UNVERIFIED]</span>
              </p>
              <p className="font-mono text-xs text-white/80 text-left mt-2 overflow-x-auto whitespace-nowrap">
                <span className="text-yellow-300">➜</span> getmefcknabi
                generates:
                <span className="text-green-400">
                  {" "}
                  [getPool, createPool, setOwner, owner, ...]
                </span>
              </p>
            </div>
            <p className="text-white/80 text-sm">
              Our algorithm can recover function names, inputs, outputs, and
              more - even from proxied or complex contracts.
            </p>
          </div>
        </div>

        {/* Main CTA */}
        <button
          onClick={() => router.push("/abi")}
          className="bg-yellow-300 hover:bg-yellow-400 text-purple-900 font-bold text-xl py-5 px-10 rounded-full transform transition-all duration-300 hover:scale-105 hover:rotate-1 shadow-lg mb-8"
        >
          GET ME THE FCKN ABI NOW! 🚀
        </button>

        {/* Use cases */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg border border-white/10">
            <p className="text-white font-medium">🧪 For Developers</p>
            <p className="text-white/70 text-sm">
              Build tools that interact with any contract
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg border border-white/10">
            <p className="text-white font-medium">🔍 For Researchers</p>
            <p className="text-white/70 text-sm">
              Analyze contracts without source code
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg border border-white/10">
            <p className="text-white font-medium">🛡️ For Security</p>
            <p className="text-white/70 text-sm">
              Inspect unverified contracts for vulnerabilities
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-white/70 text-sm flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
          <span>
            Created with ❤️ by blockchain dev bezata who got tired of missing
            ABIs
          </span>
          <span className="hidden sm:inline">•</span>
          <button
            onClick={() => setShowDonationModal(true)}
            className="text-yellow-300 hover:text-yellow-400 transition-colors"
          >
            Support this project
          </button>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </div>
  );
}
