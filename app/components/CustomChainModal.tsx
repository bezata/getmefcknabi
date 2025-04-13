"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useCustomChains from "../hooks/useCustomChains";
import { getAllCustomChains } from "../lib/db";

interface CustomChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChainAdded: (chain: CustomChain) => void;
}

export interface CustomChain {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
  isTestnet?: boolean;
}

interface MongoDBResponse {
  chains: CustomChain[];
  error?: string;
}

export default function CustomChainModal({
  isOpen,
  onClose,
  onChainAdded,
}: CustomChainModalProps) {
  const { customChains, validateRpcEndpoint, removeChain, addChain } =
    useCustomChains();
  const [view, setView] = useState<"add" | "manage">("add");
  const [localCustomChains, setLocalCustomChains] = useState<CustomChain[]>([]);
  const [chainId, setChainId] = useState<string>("");
  const [chainName, setChainName] = useState<string>("");
  const [rpcUrl, setRpcUrl] = useState<string>("");
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string>("");
  const [isTestnet, setIsTestnet] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "success" | "error" | "loading"
  >("idle");
  const [chainToDelete, setChainToDelete] = useState<number | null>(null);

  // Load chains on mount and when view changes
  useEffect(() => {
    const loadChains = async () => {
      try {
        const response = (await getAllCustomChains()) as
          | MongoDBResponse
          | CustomChain[];
        console.log("Loaded chains in modal:", response);
        // Extract chains array from the response
        const chains = Array.isArray(response)
          ? response
          : response.chains || [];
        setLocalCustomChains(chains);
      } catch (error) {
        console.error("Failed to load chains in modal:", error);
        setLocalCustomChains([]);
      }
    };

    if (isOpen) {
      loadChains();
    }
  }, [isOpen, view]);

  const resetForm = () => {
    setChainId("");
    setChainName("");
    setRpcUrl("");
    setBlockExplorerUrl("");
    setIsTestnet(false);
    setValidationStatus("idle");
    setValidationMessage("");
    setView("add");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddChain = async () => {
    try {
      // Basic validation
      if (!chainId || !chainName || !rpcUrl) {
        setValidationStatus("error");
        setValidationMessage("Chain ID, name, and RPC URL are required");
        return;
      }

      // Check if chain ID is a number
      const parsedChainId = parseInt(chainId, 10);
      if (isNaN(parsedChainId)) {
        setValidationStatus("error");
        setValidationMessage("Chain ID must be a number");
        return;
      }

      // Check if RPC URL is valid
      if (!rpcUrl.startsWith("http")) {
        setValidationStatus("error");
        setValidationMessage("RPC URL must start with http:// or https://");
        return;
      }

      // Check if block explorer URL is valid if provided
      if (blockExplorerUrl && !blockExplorerUrl.startsWith("http")) {
        setValidationStatus("error");
        setValidationMessage(
          "Block Explorer URL must start with http:// or https://"
        );
        return;
      }

      // Validate the RPC endpoint
      setIsValidating(true);
      setValidationStatus("loading");
      setValidationMessage("Validating RPC endpoint...");

      try {
        // Test the RPC endpoint with actual API call
        const isValid = await validateRpcEndpoint(rpcUrl, parsedChainId);

        if (isValid) {
          setValidationStatus("success");
          setValidationMessage("RPC endpoint validated successfully! 🚀");

          // Add the chain with testnet status
          const newChain: CustomChain = {
            id: parsedChainId,
            name: chainName,
            rpcUrl: rpcUrl,
            blockExplorerUrl: blockExplorerUrl || undefined,
            isTestnet: isTestnet,
          };

          console.log("Adding new chain:", newChain);
          await addChain(newChain);
          console.log("Chain added successfully");

          // Call the onChainAdded callback
          onChainAdded(newChain);

          // Wait a bit to show success message before closing
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setValidationStatus("error");
          setValidationMessage(
            "Could not connect to RPC endpoint or chain ID mismatch"
          );
        }
      } catch (error) {
        console.error("Chain validation error:", error);
        setValidationStatus("error");
        setValidationMessage(
          "An error occurred while validating the RPC endpoint"
        );
      }
    } catch (error) {
      console.error("Error in handleAddChain:", error);
      setValidationStatus("error");
      setValidationMessage("Failed to add chain");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveChain = async (id: number) => {
    setChainToDelete(id);

    try {
      await removeChain(id);
      // Chain removed successfully
      setChainToDelete(null);
    } catch (error) {
      console.error("Failed to remove chain:", error);
      setChainToDelete(null);
    }
  };

  // Variant for the motion div
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 25, stiffness: 500 },
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  // Backdrop variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Update the validation button click handler
  const validateChain = () => {
    console.log("Starting chain validation...");
    handleAddChain();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            onClick={handleClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div
              className="bg-black/80 border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {view === "add"
                      ? "Add Custom Chain"
                      : "Manage Custom Chains"}
                  </h2>
                  <div className="flex items-center">
                    {localCustomChains.length > 0 && (
                      <button
                        onClick={() =>
                          setView(view === "add" ? "manage" : "add")
                        }
                        className="mr-3 text-yellow-300 hover:text-yellow-400 transition-colors bg-yellow-500/10 px-3 py-1.5 rounded-full text-xs"
                      >
                        {view === "add" ? "Manage Chains" : "Add New Chain"}
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {view === "add" ? (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-white/90 text-sm mb-2">
                        Chain ID
                      </label>
                      <input
                        type="text"
                        value={chainId}
                        onChange={(e) => setChainId(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-4 py-3 focus:border-yellow-300 focus:outline-none transition-colors"
                        placeholder="e.g. 42220"
                        disabled={isValidating}
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 text-sm mb-2">
                        Chain Name
                      </label>
                      <input
                        type="text"
                        value={chainName}
                        onChange={(e) => setChainName(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-4 py-3 focus:border-yellow-300 focus:outline-none transition-colors"
                        placeholder="e.g. Celo Mainnet"
                        disabled={isValidating}
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 text-sm mb-2">
                        RPC URL
                      </label>
                      <input
                        type="text"
                        value={rpcUrl}
                        onChange={(e) => setRpcUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-4 py-3 focus:border-yellow-300 focus:outline-none transition-colors"
                        placeholder="e.g. https://forno.celo.org"
                        disabled={isValidating}
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 text-sm mb-2">
                        Block Explorer URL (optional)
                      </label>
                      <input
                        type="text"
                        value={blockExplorerUrl}
                        onChange={(e) => setBlockExplorerUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-4 py-3 focus:border-yellow-300 focus:outline-none transition-colors"
                        placeholder="e.g. https://explorer.celo.org"
                        disabled={isValidating}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isTestnet"
                        checked={isTestnet}
                        onChange={(e) => setIsTestnet(e.target.checked)}
                        className="w-4 h-4 mr-2 accent-yellow-300 bg-black/40 border border-white/20 rounded focus:ring-yellow-500"
                        disabled={isValidating}
                      />
                      <label
                        htmlFor="isTestnet"
                        className="text-white/90 text-sm cursor-pointer select-none"
                      >
                        This is a testnet
                      </label>
                    </div>

                    {validationMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg text-sm ${
                          validationStatus === "error"
                            ? "bg-red-500/30 border border-red-500/30 text-white"
                            : validationStatus === "success"
                            ? "bg-green-500/30 border border-green-500/30 text-white"
                            : "bg-yellow-500/30 border border-yellow-500/30 text-white"
                        }`}
                      >
                        <div className="flex items-center">
                          {validationStatus === "loading" && (
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          )}
                          {validationStatus === "success" && (
                            <svg
                              className="w-4 h-4 mr-2 text-green-400"
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
                          )}
                          {validationStatus === "error" && (
                            <svg
                              className="w-4 h-4 mr-2 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              ></path>
                            </svg>
                          )}
                          {validationMessage}
                        </div>
                      </motion.div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        disabled={isValidating}
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={isValidating ? {} : { scale: 1.03 }}
                        whileTap={isValidating ? {} : { scale: 0.97 }}
                        onClick={validateChain}
                        disabled={isValidating}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isValidating
                            ? "bg-yellow-300/50 text-yellow-900/50 cursor-not-allowed"
                            : "bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
                        }`}
                      >
                        {isValidating ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-yellow-900 border-t-transparent rounded-full"></div>
                            Validating...
                          </div>
                        ) : (
                          "Add Chain"
                        )}
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                    {localCustomChains.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-white/60 mb-4">
                          No custom chains added yet
                        </p>
                        <button
                          onClick={() => setView("add")}
                          className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 rounded-lg transition-colors font-medium"
                        >
                          Add Your First Chain
                        </button>
                      </div>
                    ) : (
                      localCustomChains.map((chain: CustomChain) => (
                        <motion.div
                          key={chain.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-black/40 border border-white/20 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-medium">
                                {chain.name}
                                {chain.isTestnet && (
                                  <span className="ml-2 text-xs bg-yellow-300/30 text-yellow-200 rounded-full px-2 py-0.5">
                                    Testnet
                                  </span>
                                )}
                              </h3>
                              <p className="text-white/60 text-sm mt-1">
                                ID: {chain.id}
                              </p>
                              <div className="mt-2 text-xs text-white/50 truncate max-w-[220px]">
                                {chain.rpcUrl}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveChain(chain.id)}
                              disabled={chainToDelete === chain.id}
                              className={`text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-colors ${
                                chainToDelete === chain.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {chainToDelete === chain.id ? (
                                <div className="animate-spin h-5 w-5 border-2 border-red-400 border-t-transparent rounded-full" />
                              ) : (
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          {chain.blockExplorerUrl && (
                            <a
                              href={chain.blockExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-300 hover:text-yellow-400 text-xs flex items-center mt-2"
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
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                              Explorer
                            </a>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-yellow-300/10 border-t border-white/10">
                <div className="flex items-start">
                  <div className="text-yellow-300 mr-2 mt-1">💡</div>
                  <p className="text-white/70 text-sm">
                    {view === "add"
                      ? "Adding a custom chain helps us connect to networks that aren't in our default list. You'll need the Chain ID, a name, and a working RPC endpoint."
                      : "Your custom chains are permanently stored in your browser and will be available across sessions."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
