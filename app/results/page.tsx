"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ContractFunction } from "../lib/whatsabi";
import DonationModal, { DONATION_ADDRESSES } from "../components/DonationModal";

// Component that uses searchParams and needs to be wrapped in Suspense
function ContractResults() {
  const searchParams = useSearchParams();
  const contractAddress = searchParams?.get("address") || "";
  const chainId = parseInt(searchParams?.get("chainId") || "1", 10);

  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [abi, setABI] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"functions" | "abi" | "analysis">(
    "functions"
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [analyzeReady, setAnalyzeReady] = useState<boolean>(false);
  const [showDonationModal, setShowDonationModal] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<{
    writeFunctions: number;
    readFunctions: number;
    events: number;
    isERC20: boolean;
    isERC721: boolean;
    isProxy: boolean;
    hasAdminFunctions: boolean;
    hasMintFunctions: boolean;
    implementationAddress?: string;
  }>({
    writeFunctions: 0,
    readFunctions: 0,
    events: 0,
    isERC20: false,
    isERC721: false,
    isProxy: false,
    hasAdminFunctions: false,
    hasMintFunctions: false,
  });

  useEffect(() => {
    if (!contractAddress) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch functions
        const functionsResponse = await fetch(
          `/api/contract/functions?address=${contractAddress}&chainId=${chainId}`
        );
        const functionsData = await functionsResponse.json();

        if (!functionsResponse.ok) {
          throw new Error(
            functionsData.error || "Failed to load contract functions"
          );
        }

        setFunctions(functionsData.functions);

        // Fetch ABI
        const abiResponse = await fetch(
          `/api/contract/abi?address=${contractAddress}&chainId=${chainId}`
        );
        const abiData = await abiResponse.json();

        if (!abiResponse.ok) {
          throw new Error(abiData.error || "Failed to load contract ABI");
        }

        setABI(abiData.formattedABI);

        // Analyze the contract
        const analysisResult = analyzeContract(functionsData.functions);

        // If proxy contract, try to get implementation address
        if (analysisResult.isProxy) {
          try {
            // Check if there's an implementation function we can call
            const implFunction = functionsData.functions.find(
              (f: ContractFunction) =>
                (f.name.toLowerCase() === "implementation" ||
                  f.name.toLowerCase() === "getimplementation") &&
                f.stateMutability === "view" &&
                f.inputs.length === 0
            );

            if (implFunction && implFunction.sighash) {
              // Call the implementation function to get the address
              const implResponse = await fetch(
                `/api/contract/read?address=${contractAddress}&chainId=${chainId}&function=${implFunction.sighash}`
              );

              if (implResponse.ok) {
                const implData = await implResponse.json();
                if (
                  implData.result &&
                  typeof implData.result === "string" &&
                  implData.result.startsWith("0x")
                ) {
                  // Update analysis with implementation address
                  setAnalysis((prev) => ({
                    ...prev,
                    implementationAddress: implData.result,
                  }));
                }
              }
            }
          } catch (implError) {
            console.error("Error fetching implementation address:", implError);
            // Just continue without implementation address
          }
        }
      } catch (err: any) {
        console.error("Error loading contract data:", err);
        setError(err.message || "Failed to load contract data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, chainId]);

  const analyzeContract = (functions: ContractFunction[]) => {
    // Count function types
    let writeFunctions = 0;
    let readFunctions = 0;
    let events = 0;

    // Check for standard interfaces
    let transferFound = false;
    let balanceOfFound = false;
    let approveFound = false;
    let transferFromFound = false;
    let ownerOfFound = false;
    let safeTransferFromFound = false;

    // Check for admin functions
    let adminFunctions = false;
    let mintFunctions = false;
    let proxyLookup = false;

    // Proxy pattern detection
    const proxyPatterns = [
      // OpenZeppelin proxy patterns
      "implementation",
      "upgradeto",
      "delegate",
      // EIP-1967 patterns
      "beacon",
      "admin",
      "logic",
      "getimplementation",
      // UUPS proxies
      "proxyadmin",
      "upgradeproxy",
      // Diamond/Facet proxies
      "diamond",
      "facet",
      "loupe",
      // Generic proxy terms
      "proxy",
    ];

    // Analyze functions
    functions.forEach((func) => {
      // Count by state mutability
      if (func.stateMutability === "view" || func.stateMutability === "pure") {
        readFunctions++;
      } else {
        writeFunctions++;
      }

      // Check for ERC20 functions
      if (func.name === "transfer" || func.name === "transferFrom")
        transferFound = true;
      if (func.name === "balanceOf") balanceOfFound = true;
      if (func.name === "approve") approveFound = true;
      if (func.name === "transferFrom") transferFromFound = true;

      // Check for ERC721 functions
      if (func.name === "ownerOf") ownerOfFound = true;
      if (func.name === "safeTransferFrom") safeTransferFromFound = true;

      // Check for admin/ownership functions
      if (
        func.name.toLowerCase().includes("admin") ||
        func.name.toLowerCase().includes("owner") ||
        func.name.toLowerCase().includes("governance")
      ) {
        adminFunctions = true;
      }

      // Check for mint functions
      if (
        func.name.toLowerCase().includes("mint") ||
        func.name.toLowerCase().includes("create")
      ) {
        mintFunctions = true;
      }

      // Check for proxy patterns with a more comprehensive approach
      const funcNameLower = func.name.toLowerCase();
      if (proxyPatterns.some((pattern) => funcNameLower.includes(pattern))) {
        proxyLookup = true;
      }

      // Check for specific proxy selectors
      if (
        func.sighash === "0x5c60da1b" || // implementation()
        func.sighash === "0x3659cfe6" || // upgradeTo(address)
        func.sighash === "0xf851a440" || // admin()
        func.sighash === "0x4f1ef286"
      ) {
        // delegatecall proxy pattern
        proxyLookup = true;
      }
    });

    const analysisResult = {
      writeFunctions,
      readFunctions,
      events,
      isERC20:
        transferFound && balanceOfFound && approveFound && transferFromFound,
      isERC721: ownerOfFound && safeTransferFromFound,
      isProxy: proxyLookup,
      hasAdminFunctions: adminFunctions,
      hasMintFunctions: mintFunctions,
    };

    setAnalysis(analysisResult);
    setAnalyzeReady(true);

    return analysisResult;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFunctionGroups = () => {
    // Group functions by state mutability
    const viewFunctions = functions.filter(
      (f) => f.stateMutability === "view" || f.stateMutability === "pure"
    );

    const writeFunctions = functions.filter(
      (f) => f.stateMutability !== "view" && f.stateMutability !== "pure"
    );

    return (
      <div className="space-y-8">
        {/* View/Pure Functions */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center">
            <span className="w-4 h-4 bg-green-400 rounded-full mr-2"></span>
            Read Functions{" "}
            <span className="text-white/60 ml-2">({viewFunctions.length})</span>
          </h3>
          <div className="space-y-3">
            {viewFunctions.map((func, idx) => (
              <div
                key={idx}
                className="p-4 bg-black/30 rounded-lg border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-yellow-300">{func.name}</div>
                  <div className="text-xs px-2 py-1 rounded-full bg-green-400/20 text-green-200">
                    {func.stateMutability}
                  </div>
                </div>

                <div className="mt-3 font-mono text-white/70 text-sm">
                  {`${func.name}(${func.inputs
                    .map((i) => `${i.type} ${i.name || ""}`)
                    .join(", ")})`}
                  {func.outputs && func.outputs.length > 0 && (
                    <span className="text-white/50">
                      {" "}
                      → {func.outputs.map((o) => o.type).join(", ")}
                    </span>
                  )}
                </div>

                {func.inputs.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-white/50 mb-1">Inputs:</div>
                    <ul className="space-y-1">
                      {func.inputs.map((input, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-white/70">
                            {input.name || `param${i + 1}`}:
                          </span>
                          <span className="font-mono text-blue-300 ml-1">
                            {input.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {func.outputs && func.outputs.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-white/50 mb-1">Outputs:</div>
                    <ul className="space-y-1">
                      {func.outputs.map((output, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-white/70">
                            {output.name || `output${i + 1}`}:
                          </span>
                          <span className="font-mono text-green-300 ml-1">
                            {output.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {func.signature && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-white/50 flex justify-between">
                      <span>Signature: {func.signature}</span>
                      <span>Selector: {func.sighash}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {viewFunctions.length === 0 && (
              <div className="p-4 bg-black/20 rounded-lg text-white/60 text-center">
                No read functions found
              </div>
            )}
          </div>
        </div>

        {/* Write Functions */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center">
            <span className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></span>
            Write Functions{" "}
            <span className="text-white/60 ml-2">
              ({writeFunctions.length})
            </span>
          </h3>
          <div className="space-y-3">
            {writeFunctions.map((func, idx) => (
              <div
                key={idx}
                className="p-4 bg-black/30 rounded-lg border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-yellow-300">{func.name}</div>
                  <div className="text-xs px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-200">
                    {func.stateMutability || "nonpayable"}
                  </div>
                </div>

                <div className="mt-3 font-mono text-white/70 text-sm">
                  {`${func.name}(${func.inputs
                    .map((i) => `${i.type} ${i.name || ""}`)
                    .join(", ")})`}
                  {func.outputs && func.outputs.length > 0 && (
                    <span className="text-white/50">
                      {" "}
                      → {func.outputs.map((o) => o.type).join(", ")}
                    </span>
                  )}
                </div>

                {func.inputs.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-white/50 mb-1">Inputs:</div>
                    <ul className="space-y-1">
                      {func.inputs.map((input, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-white/70">
                            {input.name || `param${i + 1}`}:
                          </span>
                          <span className="font-mono text-blue-300 ml-1">
                            {input.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {func.outputs && func.outputs.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-white/50 mb-1">Outputs:</div>
                    <ul className="space-y-1">
                      {func.outputs.map((output, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-white/70">
                            {output.name || `output${i + 1}`}:
                          </span>
                          <span className="font-mono text-green-300 ml-1">
                            {output.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {func.signature && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-white/50 flex justify-between">
                      <span>Signature: {func.signature}</span>
                      <span>Selector: {func.sighash}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {writeFunctions.length === 0 && (
              <div className="p-4 bg-black/20 rounded-lg text-white/60 text-center">
                No write functions found
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderABI = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Raw ABI</h3>
          <button
            onClick={() => copyToClipboard(abi)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md transition-colors"
          >
            {copied ? "Copied! ✓" : "Copy ABI"}
          </button>
        </div>
        <div className="bg-black/30 rounded-lg border border-white/10 overflow-hidden">
          <pre className="p-4 text-white/90 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
            {abi}
          </pre>
        </div>
        <div className="mt-4 text-white/60 text-sm">
          <p>
            You can use this ABI with ethers.js, viem, web3.js, or any other
            Ethereum library.
          </p>
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!analyzeReady)
      return (
        <div className="p-8 text-center text-white/60">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-300 mx-auto mb-4"></div>
          Analyzing contract...
        </div>
      );

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Contract Analysis</h3>

        {/* Contract Type */}
        <div className="p-4 bg-black/30 rounded-lg border border-white/10">
          <h4 className="font-medium text-white mb-3">
            Contract Type Detection
          </h4>
          <div className="space-y-2">
            {analysis.isERC20 && (
              <div className="flex items-center text-green-300">
                <span className="mr-2">✓</span>
                <span>ERC20 Token Contract</span>
              </div>
            )}

            {analysis.isERC721 && (
              <div className="flex items-center text-green-300">
                <span className="mr-2">✓</span>
                <span>ERC721 NFT Contract</span>
              </div>
            )}

            {analysis.isProxy && (
              <div className="flex items-center text-blue-300">
                <span className="mr-2">ℹ</span>
                <span>Proxy Contract (implementation is likely separate)</span>
              </div>
            )}

            {!analysis.isERC20 && !analysis.isERC721 && !analysis.isProxy && (
              <div className="flex items-center text-white/70">
                <span className="mr-2">•</span>
                <span>Custom Contract (not a standard token type)</span>
              </div>
            )}
          </div>
        </div>

        {/* Function Stats */}
        <div className="p-4 bg-black/30 rounded-lg border border-white/10">
          <h4 className="font-medium text-white mb-3">Function Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-3 rounded-md text-center">
              <div className="text-2xl font-bold text-green-300">
                {analysis.readFunctions}
              </div>
              <div className="text-white/70 text-sm">Read Functions</div>
            </div>
            <div className="bg-black/20 p-3 rounded-md text-center">
              <div className="text-2xl font-bold text-yellow-300">
                {analysis.writeFunctions}
              </div>
              <div className="text-white/70 text-sm">Write Functions</div>
            </div>
          </div>
        </div>

        {/* Add proxy info box after function statistics */}
        {analysis.isProxy && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-yellow-300 mb-2">
                  Proxy Contract Detected
                </h4>
                <p className="text-white/80 text-sm mb-3">
                  This is a proxy contract that delegates calls to an
                  implementation contract. The ABI shown here is for the proxy
                  interface only.
                </p>

                <div className="bg-black/30 border border-yellow-500/20 p-3 rounded-md text-sm mb-3 flex items-start">
                  <span className="text-yellow-300 text-xl mr-2">⚠️</span>
                  <p className="text-white/90">
                    <span className="font-semibold text-yellow-300">
                      Hey there!{" "}
                    </span>
                    We're working on better proxy contract handling! 💪 This ABI
                    is just for the proxy itself, not the actual implementation
                    where all the cool stuff happens. But don't worry, we're
                    actively improving this - stay tuned for even better proxy
                    detection soon! 🚀
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded-md text-sm mb-3">
                  <p className="text-white/70 mb-2">
                    <span className="text-yellow-300 font-medium">
                      How proxy contracts work:{" "}
                    </span>
                    Proxy contracts use{" "}
                    <code className="bg-black/40 px-1 rounded">
                      delegatecall
                    </code>{" "}
                    to forward function calls to an implementation contract
                    while keeping storage in the proxy contract.
                  </p>
                  <p className="text-white/70">
                    This pattern allows for upgrading the contract logic without
                    changing the contract address or losing state.
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <p className="text-white/80 text-sm">
                    Most proxy contracts include functions for:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                    <li>Getting the current implementation address</li>
                    <li>Upgrading to a new implementation (admin only)</li>
                    <li>Managing admin/ownership rights</li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-yellow-500/20">
                  <p className="text-white/80 text-sm mb-3">
                    <span className="text-yellow-300 font-medium">
                      Want the full ABI?{" "}
                    </span>
                    You may be interested in the implementation contract
                    instead:
                  </p>

                  {analysis.implementationAddress ? (
                    <div className="bg-black/30 p-3 rounded-md mb-3">
                      <p className="text-white/80 text-sm mb-2">
                        Implementation contract found:
                      </p>
                      <div className="flex items-center">
                        <span className="font-mono text-xs text-green-300 bg-green-500/10 p-1.5 rounded mr-2 break-all">
                          {analysis.implementationAddress}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(analysis.implementationAddress!)
                          }
                          className="text-white/60 hover:text-white/90 p-1"
                        >
                          📋
                        </button>
                      </div>
                      <div className="mt-2 flex">
                        <Link
                          href={`/abi?address=${analysis.implementationAddress}&chainId=${chainId}`}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
                        >
                          Get Implementation ABI →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={() => {
                          const implFunc = functions.find(
                            (f) =>
                              f.name.toLowerCase().includes("implementation") &&
                              (f.stateMutability === "view" ||
                                f.stateMutability === "pure")
                          );

                          if (implFunc) {
                            // Copy a note to clipboard about checking implementation
                            const message = `To get the full ABI, you should check the implementation contract.\n\nThis proxy contract (${contractAddress}) likely has a function "${implFunc.name}" that returns the implementation address.`;
                            navigator.clipboard.writeText(message);
                            alert("Implementation info copied to clipboard!");
                          } else {
                            alert(
                              "Could not find implementation function in this proxy contract."
                            );
                          }
                        }}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Check Implementation
                      </button>
                      <Link
                        href={`/abi?address=${contractAddress}&chainId=${chainId}&note=proxy`}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Try Another Contract
                      </Link>
                    </div>
                  )}

                  <p className="text-xs text-white/60 mt-2 italic">
                    ProTip: Try looking for an "admin" or "ownership" event in
                    the contract's transaction history to find clues about the
                    implementation contract.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Features */}
        <div className="p-4 bg-black/30 rounded-lg border border-white/10">
          <h4 className="font-medium text-white mb-3">Admin Features</h4>
          <div className="space-y-2">
            {analysis.hasAdminFunctions && (
              <div className="flex items-center text-yellow-300">
                <span className="mr-2">⚠</span>
                <span>Admin/Owner functions detected</span>
              </div>
            )}

            {analysis.hasMintFunctions && (
              <div className="flex items-center text-yellow-300">
                <span className="mr-2">⚠</span>
                <span>
                  Mint functions detected (supply can potentially be increased)
                </span>
              </div>
            )}

            {analysis.isProxy && (
              <div className="flex items-center text-yellow-300">
                <span className="mr-2">⚠</span>
                <span>Upgradeable contract (can be modified by admin)</span>
              </div>
            )}

            {!analysis.hasAdminFunctions &&
              !analysis.hasMintFunctions &&
              !analysis.isProxy && (
                <div className="flex items-center text-green-300">
                  <span className="mr-2">✓</span>
                  <span>No obvious admin functions detected</span>
                </div>
              )}
          </div>
        </div>

        <div className="p-4 bg-black/30 rounded-lg border border-white/10">
          <h4 className="font-medium text-white mb-2">Contract Usage Tips</h4>
          <p className="text-white/70 text-sm mb-2">
            Based on our analysis, here's how you might want to use this
            contract:
          </p>
          <ul className="space-y-1 text-sm text-white/80 list-disc pl-5">
            {analysis.isERC20 && (
              <li>
                Use standard ERC20 methods like transfer, balanceOf, and approve
              </li>
            )}
            {analysis.isERC721 && (
              <li>
                Use standard NFT methods like ownerOf, safeTransferFrom, and
                approve
              </li>
            )}
            {analysis.isProxy && (
              <li>
                This is a proxy contract - the implementation logic is in a
                separate contract
              </li>
            )}
            {analysis.hasAdminFunctions && (
              <li>
                Be aware that admin functions can modify contract behavior
              </li>
            )}
            <li>
              Copy this ABI to your frontend code to interact with the contract
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Contract header */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Contract Results
            </h2>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-white/80 text-sm break-all">
                {contractAddress}
              </span>
              <button
                onClick={() => copyToClipboard(contractAddress)}
                className="text-white/60 hover:text-white/90"
              >
                📋
              </button>
            </div>
          </div>

          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-white/70 mr-2">Chain ID:</span>
            <span className="px-2 py-1 bg-white/10 rounded-md text-white text-sm">
              {chainId}
            </span>
          </div>
        </div>

        {/* Proxy Contract Banner */}
        {analysis.isProxy && !isLoading && (
          <div className="mt-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 flex items-center animate-pulse-slow">
            <div className="flex-shrink-0 h-8 w-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-yellow-300 text-lg">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-yellow-300 font-medium text-sm">
                Proxy Contract Detected!
                <span className="ml-1 text-white/80 font-normal">
                  This is likely just the proxy interface, not the full contract
                  implementation.
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="ml-1 text-yellow-300 hover:text-yellow-400 underline transition-colors"
                  >
                    Check the Analysis tab
                  </button>{" "}
                  for implementation details.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-300 mb-4"></div>
          <p className="mt-4 text-white/80 text-lg">Loading contract data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/50 border border-red-600 text-white px-6 py-4 rounded-lg text-center">
          <p className="text-lg font-medium mb-2">Error</p>
          <p>{error}</p>
          <Link
            href="/abi"
            className="mt-4 inline-block bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </Link>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full shadow-lg overflow-hidden border border-white/20">
              <button
                onClick={() => setActiveTab("functions")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "functions"
                    ? "bg-yellow-300 text-purple-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Functions
              </button>
              <button
                onClick={() => setActiveTab("abi")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "abi"
                    ? "bg-yellow-300 text-purple-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Raw ABI
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "analysis"
                    ? "bg-yellow-300 text-purple-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Analysis
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20">
            {activeTab === "functions" && renderFunctionGroups()}
            {activeTab === "abi" && renderABI()}
            {activeTab === "analysis" && renderAnalysis()}
          </div>
        </>
      )}

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </>
  );
}

// Loading fallback for Suspense
function ContractResultsLoading() {
  return (
    <div className="text-center py-20">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-300 mb-4"></div>
      <p className="mt-4 text-white/80 text-lg">Loading contract data...</p>
    </div>
  );
}

// Main page component that doesn't directly use searchParams
export default function ResultsPage() {
  const [showDonationModal, setShowDonationModal] = useState<boolean>(false);

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

        <div className="flex items-center space-x-4">
          <Link
            href="/abi"
            className="text-white hover:text-yellow-300 transition-colors"
          >
            ← Back to Search
          </Link>

          <button
            onClick={() => setShowDonationModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 flex items-center transition-all hover:scale-105"
          >
            <span className="mr-2">💰</span>
            <span>Donate</span>
          </button>
        </div>
      </header>

      <main className="flex-grow px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Wrap component that uses searchParams in Suspense */}
          <Suspense fallback={<ContractResultsLoading />}>
            <ContractResults />
          </Suspense>
        </div>
      </main>

      <footer className="py-6 text-center text-white/60 text-sm">
        <div className="flex flex-col items-center space-y-2">
          <p>
            Created with ❤️ by blockchain dev bezata who got tired of missing
            ABIs
          </p>
          <button
            onClick={() => setShowDonationModal(true)}
            className="mt-2 text-yellow-300 hover:text-yellow-400 transition-colors text-sm"
          >
            Support this project
          </button>
        </div>
      </footer>

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </div>
  );
}
