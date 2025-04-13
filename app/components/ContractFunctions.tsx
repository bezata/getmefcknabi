"use client";

import { useState } from "react";
import { ContractFunction } from "../lib/whatsabi";

interface ContractFunctionsProps {
  functions: ContractFunction[];
  contractAddress: string;
  chainId: number;
}

export default function ContractFunctions({
  functions,
  contractAddress,
  chainId,
}: ContractFunctionsProps) {
  const [selectedFunction, setSelectedFunction] =
    useState<ContractFunction | null>(null);
  const [functionArgs, setFunctionArgs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [txData, setTxData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFunctions = functions.filter(
    (f) => f.stateMutability === "view" || f.stateMutability === "pure"
  );

  const writeFunctions = functions.filter(
    (f) => f.stateMutability !== "view" && f.stateMutability !== "pure"
  );

  const handleSelectFunction = (func: ContractFunction) => {
    setSelectedFunction(func);
    setFunctionArgs({});
    setResult(null);
    setTxData(null);
    setError(null);
  };

  const handleInputChange = (name: string, value: string) => {
    setFunctionArgs((prev) => ({ ...prev, [name]: value }));
  };

  const handleReadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedFunction) return;

      const args = selectedFunction.inputs.map((input) => {
        const value = functionArgs[input.name] || "";

        // Parse input values based on type
        if (input.type === "uint256" || input.type.startsWith("uint")) {
          return value; // Will be converted to BigInt by the API
        } else if (input.type === "bool") {
          return value.toLowerCase() === "true";
        } else if (input.type === "address") {
          return value;
        } else {
          return value;
        }
      });

      const response = await fetch("/api/contract/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress,
          functionName: selectedFunction.name,
          args,
          chainId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to call contract");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Error calling contract:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrepareTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTxData(null);

    try {
      if (!selectedFunction) return;

      const args = selectedFunction.inputs.map((input) => {
        const value = functionArgs[input.name] || "";

        // Parse input values based on type
        if (input.type === "uint256" || input.type.startsWith("uint")) {
          return value; // Will be converted to BigInt by the API
        } else if (input.type === "bool") {
          return value.toLowerCase() === "true";
        } else if (input.type === "address") {
          return value;
        } else {
          return value;
        }
      });

      const response = await fetch("/api/contract/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress,
          functionName: selectedFunction.name,
          args,
          chainId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare transaction");
      }

      setTxData(data.txData);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Error preparing transaction:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format the result for display
  const formatResult = (result: any) => {
    if (result === null || result === undefined) return "null";

    if (Array.isArray(result)) {
      return (
        <div className="space-y-1">
          {result.map((item, i) => (
            <div key={i} className="pl-4 border-l-2 border-gray-300">
              {formatResult(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof result === "object") {
      return (
        <div className="space-y-1">
          {Object.entries(result).map(([key, value]) => (
            <div key={key} className="pl-4 border-l-2 border-gray-300">
              <span className="font-medium">{key}: </span>
              {formatResult(value)}
            </div>
          ))}
        </div>
      );
    }

    return String(result);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Read Functions</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {readFunctions.length === 0 ? (
            <p className="text-gray-500">No read functions found</p>
          ) : (
            readFunctions.map((func) => (
              <button
                key={func.signature}
                onClick={() => handleSelectFunction(func)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedFunction?.signature === func.signature
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {func.name}
                <span className="text-xs text-gray-500 block">
                  ({func.inputs.map((i) => `${i.type} ${i.name}`).join(", ")})
                </span>
              </button>
            ))
          )}
        </div>

        <h3 className="text-lg font-semibold mb-3 mt-6">Write Functions</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {writeFunctions.length === 0 ? (
            <p className="text-gray-500">No write functions found</p>
          ) : (
            writeFunctions.map((func) => (
              <button
                key={func.signature}
                onClick={() => handleSelectFunction(func)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedFunction?.signature === func.signature
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {func.name}
                <span className="text-xs text-gray-500 block">
                  ({func.inputs.map((i) => `${i.type} ${i.name}`).join(", ")})
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                  Write
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {selectedFunction ? (
          <>
            <h3 className="text-lg font-semibold mb-3">
              {selectedFunction.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedFunction.signature}
            </p>

            <form
              onSubmit={
                selectedFunction.stateMutability === "view" ||
                selectedFunction.stateMutability === "pure"
                  ? handleReadSubmit
                  : handlePrepareTransaction
              }
            >
              {selectedFunction.inputs.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-md font-medium">Inputs</h4>
                  {selectedFunction.inputs.map((input) => (
                    <div key={input.name} className="flex flex-col">
                      <label className="text-sm font-medium mb-1">
                        {input.name} ({input.type})
                      </label>
                      <input
                        type="text"
                        value={functionArgs[input.name] || ""}
                        onChange={(e) =>
                          handleInputChange(input.name, e.target.value)
                        }
                        placeholder={`Enter ${input.type}`}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Outputs</h4>
                <div className="text-sm text-gray-600">
                  {selectedFunction.outputs.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {selectedFunction.outputs.map((output, i) => (
                        <li key={i}>
                          {output.name || `Output ${i + 1}`} ({output.type})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No outputs</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 ${
                  selectedFunction.stateMutability === "view" ||
                  selectedFunction.stateMutability === "pure"
                    ? "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500"
                }`}
              >
                {isLoading
                  ? "Loading..."
                  : selectedFunction.stateMutability === "view" ||
                    selectedFunction.stateMutability === "pure"
                  ? "Call Function"
                  : "Prepare Transaction"}
              </button>
            </form>

            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {result !== null && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Result</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                  {formatResult(result)}
                </div>
              </div>
            )}

            {txData !== null && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Transaction Data</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(txData, null, 2)}
                  </pre>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This transaction data can be used with your wallet to execute
                  the transaction.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-500">
              Select a function to interact with the contract
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
