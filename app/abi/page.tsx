"use client";

import { useState, useEffect } from "react";
import ContractForm from "../components/ContractForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContractFunction } from "../lib/whatsabi";
import DonationModal, { DONATION_ADDRESSES } from "../components/DonationModal";
import { motion } from "framer-motion";
import CustomChainModal, { CustomChain } from "../components/CustomChainModal";

const LOADING_MESSAGES = [
  "Extracting function selectors from bytecode...",
  "Hunting down those elusive 4byte signatures...",
  "Matching selectors to function signatures...",
  "Decompiling contract bytecode...",
  "Analyzing proxy implementations...",
  "Constructing your f*cking ABI...",
  "Bypassing Etherscan verification requirements...",
  "Doing what Etherscan can't...",
  "Reverse engineering contract interfaces...",
  "Converting bytecode to human-readable ABI...",
  "Reconstructing function inputs and outputs...",
  "Who needs verification anyway?...",
  "Doing the impossible...",
  "Magic in progress...",
  "Almost there, hang tight...",
];

const DONATE_MESSAGES = [
  "Like this tool? Send some crypto! 🚀",
  "Saved your project? Show some love! 💰",
  "Donate or I'm taking your ABI back 😂",
  "Open source doesn't pay the bills, your donations do! 🙏",
  "Running this costs $$$, your donations help keep it alive 🚀",
  "Hours of work went into this... minutes of donation can help! ⏱️",
];

export default function ABIPage() {
  const router = useRouter();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(1);
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [donateMessage, setDonateMessage] = useState<string>("");
  const [showDonationModal, setShowDonationModal] = useState<boolean>(false);
  const [showCustomChainModal, setShowCustomChainModal] =
    useState<boolean>(false);
  const [forceChainUpdate, setForceChainUpdate] = useState<number>(0);

  // Pick a random donate message on page load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DONATE_MESSAGES.length);
    setDonateMessage(DONATE_MESSAGES[randomIndex]);
  }, []);

  // Simulate loading animation with funny messages
  useEffect(() => {
    if (!isLoading) return;

    let currentMessage = 0;
    let progress = 0;

    const interval = setInterval(() => {
      // Update loading message
      setLoadingMessage(LOADING_MESSAGES[currentMessage]);
      currentMessage = (currentMessage + 1) % LOADING_MESSAGES.length;

      // Update loading progress
      progress += Math.random() * 15;
      if (progress > 100) progress = 100;
      setLoadingProgress(progress);
    }, 1200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleContractSubmit = async (
    address: string,
    selectedChainId: number
  ) => {
    setIsLoading(true);
    setError(null);
    setShowResults(false);
    setLoadingProgress(0);

    console.log(
      `Contract submit initiated for address: ${address} on chain ID: ${selectedChainId}`
    );

    try {
      // Call API to get contract functions
      const apiUrl = `/api/contract/functions?address=${address}&chainId=${selectedChainId}`;
      console.log(`Calling API endpoint: ${apiUrl}`);

      const response = await fetch(apiUrl);
      console.log(`API response status: ${response.status}`);

      const data = await response.json();
      console.log(`API response data:`, data);

      if (!response.ok) {
        console.error(`API error: ${data.error}`);
        throw new Error(data.error || "Failed to load contract functions");
      }

      setContractAddress(address);
      setChainId(selectedChainId);
      setFunctions(data.functions);
      console.log(`Successfully loaded ${data.functions.length} functions`);

      // Fake a little extra loading time for dramatic effect
      setTimeout(() => {
        setIsLoading(false);
        setShowResults(true);
      }, 2000);
    } catch (err: any) {
      console.error("Error loading contract:", err);
      setError(err.message || "Failed to load contract");
      setFunctions([]);
      setIsLoading(false);
    }
  };

  const navigateToResults = () => {
    router.push(`/results?address=${contractAddress}&chainId=${chainId}`);
  };

  const handleShowCustomChainModal = () => {
    setShowCustomChainModal(true);
  };

  const handleCloseCustomChainModal = () => {
    setShowCustomChainModal(false);
  };

  const handleCustomChainAdded = (chain: CustomChain) => {
    // Close the modal
    setShowCustomChainModal(false);

    // Force a re-render of all chain-dependent components
    setForceChainUpdate((prev) => prev + 1);

    // Update to the newly added chain
    setChainId(chain.id);

    // Show success message
    console.log(`Chain ${chain.name} (ID: ${chain.id}) added successfully!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-purple-800">
      <header className="flex justify-between items-center px-8 py-6">
        <Link
          href="/"
          className="text-white text-3xl font-bold flex items-center hover:text-yellow-300 transition-colors"
        >
          <span className="mr-2">🔥</span>
          get<span className="text-yellow-300">me</span>fcknabi
        </Link>

        <button
          onClick={() => setShowDonationModal(true)}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 flex items-center transition-all hover:scale-105"
        >
          <span className="mr-2">💰</span>
          <span>Donate</span>
        </button>
      </header>

      <main className="flex-grow px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                Enter Contract Address
              </h2>
              <p className="text-white/80 text-center mb-6">
                Works with unverified contracts. We'll extract the ABI directly
                from bytecode.
              </p>

              <ContractForm
                onSubmit={handleContractSubmit}
                isLoading={isLoading}
                showCustomChainModal={showCustomChainModal}
                onShowCustomChainModal={handleShowCustomChainModal}
                onChainAdded={handleCustomChainAdded}
                key={`contract-form-${forceChainUpdate}`}
                forcedChainId={chainId}
              />
            </div>

            {error && (
              <div className="w-full max-w-lg mx-auto mt-4 bg-red-500/80 border border-red-600 text-white px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="w-full max-w-lg mx-auto mt-8 text-center">
                <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
                  <div className="mb-6">
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 200,
                        }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-white/60 text-xs">
                      <span>Fetching bytecode</span>
                      <span>{Math.round(loadingProgress)}%</span>
                      <span>Generating ABI</span>
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-purple-500 to-pink-500 rounded-full opacity-30 animate-pulse"></div>
                    <div className="relative flex justify-center">
                      <motion.div
                        animate={{
                          rotate: 360,
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          },
                          scale: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }}
                        className="h-16 w-16 rounded-full border-4 border-t-yellow-300 border-r-purple-500 border-b-pink-500 border-l-transparent"
                      />
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4"
                  >
                    <p className="text-white text-lg font-medium">
                      {loadingMessage || "Fetching the fckn ABI..."}
                    </p>
                  </motion.div>

                  <p className="text-white/60 text-sm max-w-md mx-auto italic">
                    We're analyzing the bytecode at the binary level and
                    reconstructing the contract interface...
                  </p>
                </div>
              </div>
            )}

            {showResults && (
              <div className="w-full max-w-lg mx-auto mt-8 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-xl p-6 shadow-xl mb-6"
                >
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        delay: 0.1,
                        stiffness: 260,
                      }}
                      className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-3xl"
                    >
                      ✓
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    ABI Generated Successfully!
                  </h3>
                  <p className="mb-6 text-white/80">
                    We found {functions.length} functions in this contract.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={navigateToResults}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-bold py-3 px-6 rounded-lg shadow-lg"
                  >
                    View Full Results
                  </motion.button>
                </motion.div>

                <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/10 text-left">
                  <p className="text-white font-medium mb-3">Quick preview:</p>
                  <div className="space-y-2">
                    {functions.slice(0, 3).map((func, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="font-mono bg-black/40 p-2 rounded-md border border-white/5"
                      >
                        {func.name}
                        <span
                          className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                            func.stateMutability === "view" ||
                            func.stateMutability === "pure"
                              ? "bg-green-400/30 text-green-200"
                              : "bg-yellow-400/30 text-yellow-200"
                          }`}
                        >
                          {func.stateMutability}
                        </span>
                      </motion.div>
                    ))}
                    {functions.length > 3 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/50 text-center text-sm p-2"
                      >
                        ...and {functions.length - 3} more
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Donation callout */}
          <div className="mt-10 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-white font-bold text-lg mb-1">
                  Support This Project
                </h3>
                <p className="text-white/70 text-sm">{donateMessage}</p>
              </div>
              <button
                onClick={() => setShowDonationModal(true)}
                className="bg-yellow-300 hover:bg-yellow-400 text-purple-900 font-bold py-2 px-6 rounded-lg transition-all hover:scale-105 whitespace-nowrap"
              >
                Donate Now
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-white/60 text-sm">
        <p>
          Created with ❤️ by blockchain dev bezata who got tired of missing ABIs
        </p>
      </footer>

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />

      {/* Custom Chain Modal */}
      <CustomChainModal
        isOpen={showCustomChainModal}
        onClose={handleCloseCustomChainModal}
        onChainAdded={handleCustomChainAdded}
      />
    </div>
  );
}
