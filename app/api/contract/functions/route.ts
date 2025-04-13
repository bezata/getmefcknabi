import { NextResponse } from "next/server";
import {
  getWhatsABIClient,
  getWhatsABIClientById,
} from "@/app/lib/whatsabiClient";
import { Address } from "viem";
import { SupportedChain } from "@/app/lib/providers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const addressParam = url.searchParams.get("address");

    // Support both chain ID and chain name
    let chainClient;
    const chainName = url.searchParams.get("chain") as SupportedChain;
    const chainId = url.searchParams.get("chainId");

    if (chainName) {
      chainClient = await getWhatsABIClient(chainName);
    } else if (chainId) {
      chainClient = await getWhatsABIClientById(parseInt(chainId, 10));
    } else {
      // Default to Ethereum mainnet
      chainClient = await getWhatsABIClient("ethereum");
    }

    // Validate address format before proceeding
    if (!addressParam || !addressParam.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          error:
            "Valid contract address is required (0x followed by 40 hex characters)",
        },
        { status: 400 }
      );
    }

    // Explicitly type cast address to ensure it's treated as an Address type
    const contractAddress = addressParam as Address;

    // Get contract functions
    const functions = await chainClient.getContractFunctions(contractAddress);

    return NextResponse.json({ functions });
  } catch (error: any) {
    console.error("Error getting contract functions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get contract functions" },
      { status: 500 }
    );
  }
}
