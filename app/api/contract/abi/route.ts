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
    const contractAddress = url.searchParams.get("address");

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

    if (
      !contractAddress ||
      contractAddress === "0x" ||
      contractAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return NextResponse.json(
        { error: "Valid contract address is required" },
        { status: 400 }
      );
    }

    // Get contract ABI
    const result = await chainClient.parseContract(contractAddress as Address);

    // Format the ABI for display
    const formattedABI = chainClient.formatABI(result.abi);

    return NextResponse.json({
      address: result.address,
      abi: result.abi,
      formattedABI,
    });
  } catch (error: any) {
    console.error("Error getting contract ABI:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get contract ABI" },
      { status: 500 }
    );
  }
}
