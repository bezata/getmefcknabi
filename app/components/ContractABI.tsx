"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";

interface ContractABIProps {
  contractAddress: string;
  chainId: number;
}

export default function ContractABI({
  contractAddress,
  chainId,
}: ContractABIProps) {
  const [abi, setABI] = useState<any[] | null>(null);
  const [formattedABI, setFormattedABI] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"visual" | "json">("visual");

  useEffect(() => {
    if (!contractAddress) return;

    const fetchABI = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/contract/abi?address=${contractAddress}&chainId=${chainId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch ABI");
        }

        setABI(data.abi);
        setFormattedABI(data.formattedABI);
      } catch (err: any) {
        console.error("Error fetching ABI:", err);
        setError(err.message || "Failed to fetch ABI");
      } finally {
        setIsLoading(false);
      }
    };

    fetchABI();
  }, [contractAddress, chainId]);

  // Group ABI by type for better display
  const groupedABI = abi
    ? {
        functions: abi.filter((item) => item.type === "function"),
        events: abi.filter((item) => item.type === "event"),
        errors: abi.filter((item) => item.type === "error"),
        others: abi.filter(
          (item) => !["function", "event", "error"].includes(item.type)
        ),
      }
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Contract ABI</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType("visual")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewType === "visual"
                ? "bg-yellow-300 text-purple-900"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewType("json")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewType === "json"
                ? "bg-yellow-300 text-purple-900"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-yellow-300"></div>
          <p className="mt-4 text-white/80 text-lg">Loading the fckn ABI...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/50 border border-red-600 text-white px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!isLoading && !error && abi && viewType === "json" && (
        <div className="mt-4">
          <pre className="bg-black/30 p-4 rounded-md overflow-x-auto text-sm whitespace-pre-wrap text-white/90 border border-white/10">
            {formattedABI}
          </pre>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(formattedABI);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm transition-colors"
            >
              Copy ABI
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && groupedABI && viewType === "visual" && (
        <div className="mt-4 space-y-6">
          {/* Functions */}
          {groupedABI.functions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-white">
                Functions ({groupedABI.functions.length})
              </h3>
              <div className="space-y-3">
                {groupedABI.functions.map((func, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-black/30 rounded-md border border-white/10"
                  >
                    <div className="font-medium text-white">
                      {func.name}
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          func.stateMutability === "view" ||
                          func.stateMutability === "pure"
                            ? "bg-green-400/90 text-green-900"
                            : "bg-yellow-300/90 text-yellow-900"
                        }`}
                      >
                        {func.stateMutability || "nonpayable"}
                      </span>
                    </div>

                    {func.inputs && func.inputs.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-white/70">Inputs:</div>
                        <ul className="list-disc list-inside text-sm pl-2 text-white/90">
                          {func.inputs.map((input: any, i: number) => (
                            <li key={i}>
                              {input.name || `param${i + 1}`}:{" "}
                              <span className="font-mono">{input.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {func.outputs && func.outputs.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-white/70">Outputs:</div>
                        <ul className="list-disc list-inside text-sm pl-2 text-white/90">
                          {func.outputs.map((output: any, i: number) => (
                            <li key={i}>
                              {output.name || `output${i + 1}`}:{" "}
                              <span className="font-mono">{output.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {func.selector && (
                      <div className="mt-1 text-xs text-white/50">
                        Selector: {func.selector}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {groupedABI.events.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-white">
                Events ({groupedABI.events.length})
              </h3>
              <div className="space-y-3">
                {groupedABI.events.map((event, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-black/30 rounded-md border border-white/10"
                  >
                    <div className="font-medium text-white">{event.name}</div>

                    {event.inputs && event.inputs.length > 0 && (
                      <div className="mt-2">
                        <ul className="list-disc list-inside text-sm pl-2 text-white/90">
                          {event.inputs.map((input: any, i: number) => (
                            <li key={i}>
                              {input.name || `param${i + 1}`}:{" "}
                              <span className="font-mono">{input.type}</span>
                              {input.indexed && (
                                <span className="ml-2 text-xs bg-blue-400/90 text-blue-900 px-1 rounded">
                                  indexed
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {event.hash && (
                      <div className="mt-1 text-xs text-white/50">
                        Hash: {event.hash}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {groupedABI.errors && groupedABI.errors.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">
                Errors ({groupedABI.errors.length})
              </h3>
              <div className="space-y-3">
                {groupedABI.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <div className="font-medium">{error.name}</div>

                    {error.inputs && error.inputs.length > 0 && (
                      <div className="mt-2">
                        <ul className="list-disc list-inside text-sm pl-2">
                          {error.inputs.map((input: any, i: number) => (
                            <li key={i}>
                              {input.name || `param${i + 1}`}:{" "}
                              <span className="font-mono">{input.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && (!abi || abi.length === 0) && (
        <div className="text-center py-10">
          <p className="text-gray-500">No ABI found for this contract</p>
        </div>
      )}
    </div>
  );
}
