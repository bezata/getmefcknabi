import { NextResponse } from "next/server";
import {
  getWhatsABIClient,
  getWhatsABIClientById,
} from "@/app/lib/whatsabiClient";
import { Address } from "viem";
import { SupportedChain } from "@/app/lib/providers";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { functionName, args, signature, sighash } = payload;
    let contractAddress = payload.contractAddress;

    // Support both chain ID and chain name
    let chainClient;
    const chainName = payload.chain as SupportedChain;
    const chainId = payload.chainId;

    if (chainName) {
      chainClient = await getWhatsABIClient(chainName);
    } else if (chainId) {
      chainClient = await getWhatsABIClientById(parseInt(chainId, 10));
    } else {
      // Default to Ethereum mainnet
      chainClient = await getWhatsABIClient("ethereum");
    }

    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address is required" },
        { status: 400 }
      );
    }

    // Validate the address format
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          error:
            "Invalid contract address format. Expected 0x followed by 40 hex characters.",
        },
        { status: 400 }
      );
    }

    // Make sure contractAddress is properly typed as Address
    // Force as string first, then as Address to ensure proper typing
    contractAddress = String(contractAddress).toLowerCase() as Address;

    console.log("API Route - Contract Address before call:", contractAddress);

    if (!functionName && !signature && !sighash) {
      return NextResponse.json(
        { error: "Function name, signature or sighash is required" },
        { status: 400 }
      );
    }

    // Call contract function
    console.log(
      "API Route - About to call readContract with address:",
      contractAddress
    );
    const result = await chainClient.readContract(contractAddress, {
      functionName,
      args,
      signature,
      sighash,
    });
    console.log("API Route - Call completed successfully");

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Error reading contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to read contract" },
      { status: 500 }
    );
  }
}
