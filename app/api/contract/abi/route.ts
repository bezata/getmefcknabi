import { NextResponse } from "next/server";
import {
  getWhatsABIClient,
  getWhatsABIClientById,
  createCustomClient,
} from "@/app/lib/whatsabiClient";
import { Address, createPublicClient, http } from "viem";
import { SupportedChain } from "@/app/lib/providers";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const contractAddress = url.searchParams.get("address");
    const rpcUrl = url.searchParams.get("rpcUrl");

    // Support both chain ID and chain name
    let chainClient;
    const chainName = url.searchParams.get("chain") as SupportedChain;
    const chainId = url.searchParams.get("chainId");

    if (rpcUrl) {
      // If RPC URL is provided, create a custom client
      chainClient = await createCustomClient(
        rpcUrl,
        chainId ? parseInt(chainId, 10) : 1
      );
    } else if (chainName) {
      // Otherwise use default clients
      chainClient = await getWhatsABIClient(chainName);
    } else if (chainId) {
      chainClient = await getWhatsABIClientById(parseInt(chainId, 10));
    } else {
      // Default to Ethereum mainnet
      chainClient = await getWhatsABIClient("ethereum");
    }

    if (
      !contractAddress ||
      contractAddress === "0x" ||
      contractAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return NextResponse.json(
        { error: "Valid contract address is required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Get contract ABI
    const result = await chainClient.parseContract(contractAddress as Address);

    // Format the ABI for display
    const formattedABI = chainClient.formatABI(result.abi);

    return NextResponse.json(
      {
        address: result.address,
        abi: result.abi,
        formattedABI,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error("Error getting contract ABI:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get contract ABI" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
