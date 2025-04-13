"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const DONATION_ADDRESSES = {
  evm: "0xDb29C392A99d1b1cF326FdA6E2926eCCbBA2df75",
  solana: "23oaq7XhJsgqRHn2FWrCLei4dADADZx4VkTPYq5nbGYh",
  bitcoin: "bc1qcuchue2ledpftn4lywt77ry6rq6aqg2k2qfud2",
};

const DONATE_MESSAGES = [
  "Like this tool? Send some crypto! 🚀",
  "Saved your project? Show some love! 💰",
  "Donate or I'm taking your ABI back 😂",
  "Open source doesn't pay the bills, your donations do! 🙏",
  "Running this costs $$$, your donations help keep it alive 🚀",
  "Hours of work went into this... minutes of donation can help! ⏱️",
];

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [activeTab, setActiveTab] = useState<"evm" | "solana" | "bitcoin">(
    "evm"
  );
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [donateMessage, setDonateMessage] = useState<string>("");

  // Pick a random message on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DONATE_MESSAGES.length);
    setDonateMessage(DONATE_MESSAGES[randomIndex]);
  }, []);

  const copyToClipboard = (type: "evm" | "solana" | "bitcoin") => {
    navigator.clipboard.writeText(DONATION_ADDRESSES[type]);
    setCopiedAddress(type);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-purple-900/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl max-w-lg w-full mx-auto z-10 overflow-hidden"
          >
            {/* Header with animated gradient */}
            <div className="relative overflow-hidden rounded-t-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-purple-500 to-pink-500 opacity-80 animate-pulse"></div>
              <div className="relative p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Support This Project
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-white/90 mt-2">{donateMessage}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("evm")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "evm"
                    ? "bg-purple-700/60 text-white border-b-2 border-yellow-300"
                    : "text-white/70 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                Ethereum / EVM
              </button>
              <button
                onClick={() => setActiveTab("solana")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "solana"
                    ? "bg-purple-700/60 text-white border-b-2 border-yellow-300"
                    : "text-white/70 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                Solana
              </button>
              <button
                onClick={() => setActiveTab("bitcoin")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "bitcoin"
                    ? "bg-purple-700/60 text-white border-b-2 border-yellow-300"
                    : "text-white/70 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                Bitcoin
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "evm" && (
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                          <span className="text-yellow-300 text-xl">Ξ</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            Ethereum / EVM
                          </h3>
                          <p className="text-white/60 text-sm">
                            Compatible with Ethereum, Polygon, BSC, etc.
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3 mb-4 relative">
                        <div className="font-mono text-white/80 text-sm break-all">
                          {DONATION_ADDRESSES.evm}
                        </div>
                        <div className="absolute right-2 top-2">
                          <button
                            onClick={() => copyToClipboard("evm")}
                            className="text-yellow-300 hover:text-yellow-400 transition-colors"
                          >
                            {copiedAddress === "evm" ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-bold rounded-md"
                            onClick={() => {
                              window.open(
                                `https://etherscan.io/address/${DONATION_ADDRESSES.evm}`,
                                "_blank"
                              );
                            }}
                          >
                            View on Etherscan
                          </motion.button>
                        </div>
                        <div className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-md transition-colors"
                            onClick={() => copyToClipboard("evm")}
                          >
                            {copiedAddress === "evm"
                              ? "Copied!"
                              : "Copy Address"}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "solana" && (
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                          <span className="text-purple-300 text-xl">◎</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Solana</h3>
                          <p className="text-white/60 text-sm">
                            Fast, low fee transactions
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3 mb-4 relative">
                        <div className="font-mono text-white/80 text-sm break-all">
                          {DONATION_ADDRESSES.solana}
                        </div>
                        <div className="absolute right-2 top-2">
                          <button
                            onClick={() => copyToClipboard("solana")}
                            className="text-yellow-300 hover:text-yellow-400 transition-colors"
                          >
                            {copiedAddress === "solana" ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-bold rounded-md"
                            onClick={() => {
                              window.open(
                                `https://solscan.io/account/${DONATION_ADDRESSES.solana}`,
                                "_blank"
                              );
                            }}
                          >
                            View on Solscan
                          </motion.button>
                        </div>
                        <div className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-md transition-colors"
                            onClick={() => copyToClipboard("solana")}
                          >
                            {copiedAddress === "solana"
                              ? "Copied!"
                              : "Copy Address"}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "bitcoin" && (
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mr-3">
                          <span className="text-orange-300 text-xl">₿</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Bitcoin</h3>
                          <p className="text-white/60 text-sm">
                            The original cryptocurrency
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3 mb-4 relative">
                        <div className="font-mono text-white/80 text-sm break-all">
                          {DONATION_ADDRESSES.bitcoin}
                        </div>
                        <div className="absolute right-2 top-2">
                          <button
                            onClick={() => copyToClipboard("bitcoin")}
                            className="text-yellow-300 hover:text-yellow-400 transition-colors"
                          >
                            {copiedAddress === "bitcoin" ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold rounded-md"
                            onClick={() => {
                              window.open(
                                `https://www.blockchain.com/explorer/addresses/btc/${DONATION_ADDRESSES.bitcoin}`,
                                "_blank"
                              );
                            }}
                          >
                            View on Explorer
                          </motion.button>
                        </div>
                        <div className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-md transition-colors"
                            onClick={() => copyToClipboard("bitcoin")}
                          >
                            {copiedAddress === "bitcoin"
                              ? "Copied!"
                              : "Copy Address"}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-white/60 text-sm">
                  Thanks for supporting getmefcknabi! ❤️
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
