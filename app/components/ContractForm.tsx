"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useCustomChains from "../hooks/useCustomChains";
import { CustomChain } from "./CustomChainModal";
import { isAddress } from "viem";

interface ContractFormProps {
  onSubmit: (address: string, chainId: number) => void;
  isLoading: boolean;
  showCustomChainModal?: boolean;
  onShowCustomChainModal?: () => void;
  onChainAdded?: (chain: CustomChain) => void;
}

export default function ContractForm({
  onSubmit,
  isLoading,
  showCustomChainModal = false,
  onShowCustomChainModal = () => {},
  onChainAdded = () => {},
}: ContractFormProps) {
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(1);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [customChainAddedMessage, setCustomChainAddedMessage] =
    useState<string>("");
  const [contractType, setContractType] = useState<string | null>(null);
  const [contractDetectionState, setContractDetectionState] = useState<
    "idle" | "detecting" | "detected" | "error"
  >("idle");
  const [suggestedChainId, setSuggestedChainId] = useState<number | null>(null);

  const { getAllChains, addChain, isLoaded, createClientForChain } =
    useCustomChains();
  const chains = getAllChains();

  // Force re-render when chains are loaded
  useEffect(() => {
    if (isLoaded) {
      // If the current chainId doesn't exist in the chains list, reset to default
      const chainExists = chains.some((chain) => chain.id === chainId);
      if (!chainExists && chains.length > 0) {
        setChainId(chains[0].id);
        setSelectedChainId(chains[0].id);
      }
    }
  }, [isLoaded, chains, chainId]);

  // Update chainId when selectedChainId changes
  useEffect(() => {
    if (selectedChainId !== null && selectedChainId !== chainId) {
      setChainId(selectedChainId);
    }
  }, [selectedChainId, chainId]);

  // Validate Ethereum address with regex and viem's isAddress
  useEffect(() => {
    const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isValidViemAddress = isAddress(address);

    setIsValid(isValidFormat && isValidViemAddress);

    // Reset contract detection when address changes
    if (contractDetectionState !== "idle") {
      setContractDetectionState("idle");
      setContractType(null);
      setSuggestedChainId(null);
    }
  }, [address]);

  // Clear the success message after 3 seconds
  useEffect(() => {
    if (!customChainAddedMessage) return;

    const timeout = setTimeout(() => {
      setCustomChainAddedMessage("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [customChainAddedMessage]);

  // Add a debounce for address typing
  useEffect(() => {
    if (!isValid) return;

    setIsTyping(true);
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
      detectContract();
    }, 800);

    return () => clearTimeout(typingTimeout);
  }, [address, isValid]);

  // Detect contract type on certain chains
  const detectContract = async () => {
    if (!isValid || isLoading) return;

    setContractDetectionState("detecting");

    try {
      // Attempt detection on mainnet first, then on other chains if needed
      const chainsToTry = [1, 137, 56, 42161, 10]; // Ethereum, Polygon, BSC, Arbitrum, Optimism

      for (const chainToTry of chainsToTry) {
        try {
          const client = await createClientForChain(chainToTry);

          // Check if contract exists on this chain
          const code = await client.getCode({
            address: address as `0x${string}`,
          });

          if (code && code !== "0x") {
            // Contract found on this chain!
            setSuggestedChainId(chainToTry);

            // Basic type detection from bytecode
            if (code.includes("0x23b872dd")) {
              setContractType("ERC-721 NFT");
            } else if (
              code.includes("0x095ea7b3") &&
              code.includes("0xa9059cbb")
            ) {
              setContractType("ERC-20 Token");
            } else if (code.includes("0x150b7a02")) {
              setContractType("ERC-721 Receiver");
            } else if (code.includes("0x01ffc9a7")) {
              setContractType("ERC-165 Compatible");
            } else {
              setContractType("Smart Contract");
            }

            setContractDetectionState("detected");
            return;
          }
        } catch (error) {
          console.error(
            `Error checking contract on chain ${chainToTry}:`,
            error
          );
          // Continue with next chain
        }
      }

      // If we get here, we didn't find a contract on any chain
      setContractDetectionState("error");
      setContractType(null);
    } catch (error) {
      console.error("Error detecting contract:", error);
      setContractDetectionState("error");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      // Use suggested chain if available, otherwise use selected chain
      const finalChainId =
        suggestedChainId !== null ? suggestedChainId : chainId;
      onSubmit(address, finalChainId);
    }
  };

  const handleAddCustomChain = (chain: CustomChain) => {
    addChain(chain);
    setCustomChainAddedMessage(
      `Added ${chain.name} (${chain.id}) successfully! 🎉`
    );
    // Set the chainId to the newly added chain
    setChainId(chain.id);
    // Call the onChainAdded prop
    onChainAdded(chain);
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Check if the text looks like an ethereum address
      if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
        setAddress(text);
        if (addressInputRef.current) {
          addressInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const useSuggestedChain = () => {
    if (suggestedChainId !== null) {
      setChainId(suggestedChainId);
      setSuggestedChainId(null);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="mb-8 relative">
          <motion.div
            className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-white/20 shadow-lg"
            whileHover={{ boxShadow: "0 0 20px rgba(252, 211, 77, 0.2)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-2">
                  <span className="text-yellow-300 text-sm">Ξ</span>
                </div>
                <h3 className="text-white font-bold">Contract Address</h3>
              </div>

              {contractDetectionState === "detected" && contractType && (
                <div className="bg-green-500/20 text-green-300 text-xs rounded-full px-3 py-1 flex items-center">
                  <span className="mr-1">●</span> {contractType}
                </div>
              )}
            </div>

            <div
              className={`relative overflow-hidden rounded-lg transition-all duration-300 border
                ${
                  isFocused
                    ? "border-yellow-300 bg-black/60 shadow-md shadow-yellow-500/5"
                    : "border-white/10 bg-black/40"
                }
                ${!isValid && address ? "border-red-400" : ""}
                ${
                  contractDetectionState === "detected"
                    ? "border-green-400"
                    : ""
                }
              `}
            >
              {isTyping && isValid && (
                <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                  <motion.div
                    className="h-1 w-20 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 rounded"
                    animate={{
                      x: ["0%", "100%"],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ marginTop: "-1px" }}
                  />
                </div>
              )}

              <div className="flex items-center px-3 py-3">
                <span className="text-white/40 text-sm font-mono mr-2">0x</span>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={address.startsWith("0x") ? address.slice(2) : address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value.startsWith("0x")
                        ? e.target.value
                        : `0x${e.target.value}`
                    )
                  }
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter contract address..."
                  className="flex-grow px-0 py-1 bg-transparent border-none outline-none text-white font-mono text-sm"
                  disabled={isLoading}
                  spellCheck={false}
                />

                <div className="flex space-x-1">
                  {address && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setAddress("")}
                      className="text-white/40 hover:text-white/80 transition-colors p-1 rounded focus:outline-none"
                      disabled={isLoading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={handlePasteClick}
                    className="text-yellow-300 hover:text-yellow-400 transition-colors p-1 rounded focus:outline-none"
                    disabled={isLoading}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>

            {!isValid && address && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-300 text-xs mt-2 flex items-center"
              >
                <svg
                  className="w-3 h-3 mr-1 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Invalid Ethereum address format
              </motion.p>
            )}

            {isTyping && isValid && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-white/70 text-xs flex items-center"
              >
                <svg
                  className="animate-spin -ml-1 mr-2 h-3 w-3 text-yellow-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing contract on popular networks...
              </motion.div>
            )}

            <AnimatePresence>
              {contractDetectionState === "detected" &&
                contractType &&
                suggestedChainId &&
                suggestedChainId !== chainId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-3 bg-green-500/10 border border-green-500/30 text-white text-sm rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                          <svg
                            className="w-4 h-4 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Contract found on{" "}
                            {chains.find((c) => c.id === suggestedChainId)
                              ?.name || `Chain #${suggestedChainId}`}
                          </p>
                          <p className="text-white/70 text-xs mt-0.5">
                            Would you like to use this network?
                          </p>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={useSuggestedChain}
                        className="ml-4 bg-green-500/40 hover:bg-green-500/60 py-2 px-3 rounded-lg text-white text-xs font-medium transition-colors"
                      >
                        Use This Network
                      </motion.button>
                    </div>
                  </motion.div>
                )}

              {contractDetectionState === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-3 bg-yellow-500/10 border border-yellow-500/30 text-white text-sm rounded-lg p-3"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Contract not detected automatically
                      </p>
                      <p className="text-white/70 text-xs mt-0.5">
                        Please select a specific network below.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                <svg
                  className="w-3 h-3 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
              <label className="text-white font-bold text-sm">
                Blockchain Network
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onShowCustomChainModal}
              className="text-yellow-300 hover:text-yellow-400 text-xs font-medium flex items-center transition-colors bg-yellow-500/10 px-3 py-1.5 rounded-full"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Custom Chain
            </motion.button>
          </div>

          {customChainAddedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-2 bg-green-500/20 border border-green-500/30 text-white text-sm rounded-lg"
            >
              {customChainAddedMessage}
            </motion.div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-yellow-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  ></path>
                </svg>
              </div>
            </div>

            <select
              value={selectedChainId || chainId}
              onChange={(e) => {
                const newChainId = parseInt(e.target.value, 10);
                setChainId(newChainId);
                setSelectedChainId(newChainId);
              }}
              className="bg-black/50 border border-white/20 text-white rounded-xl px-4 py-3 pl-10 w-full appearance-none focus:border-yellow-300 focus:ring-1 focus:ring-yellow-300/20 focus:outline-none transition-colors"
              disabled={isLoading}
            >
              {isLoaded ? (
                chains.map((chain) => (
                  <option
                    key={chain.id}
                    value={chain.id}
                    className={chain.isTestnet ? "text-yellow-300" : ""}
                  >
                    {chain.name} {chain.isTestnet ? "(Testnet)" : ""} (
                    {chain.id})
                  </option>
                ))
              ) : (
                <option value={1}>Loading chains...</option>
              )}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/60">
              ▼
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden
            ${
              isValid && !isLoading
                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 shadow-lg hover:shadow-xl"
                : "bg-white/10 text-white/50 cursor-not-allowed"
            }
          `}
        >
          {isValid && !isLoading && (
            <motion.div
              className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                repeatDelay: 3,
                duration: 1.5,
                ease: "easeInOut",
              }}
              style={{ height: "100%" }}
            />
          )}

          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-900 mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              {isValid ? "Get The Fckn ABI 🔍" : "Enter Valid Contract Address"}
            </>
          )}
        </motion.button>
      </form>
    </>
  );
}
