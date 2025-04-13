import { NextResponse } from "next/server";
import { getWhatsABIClient } from "@/app/lib/whatsabiClient";
import { Address } from "viem";
import { SupportedChain } from "@/app/lib/providers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      contractAddress,
      functionName,
      args = [],
      value,
      chainId = 1,
      signature,
      sighash,
    } = body;

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

    if (!functionName && !signature && !sighash) {
      return NextResponse.json(
        { error: "Function name, signature, or sighash is required" },
        { status: 400 }
      );
    }

    // Get WhatsABI client with specified chain ID
    const whatsabiClient = await getWhatsABIClient(chainId as SupportedChain);

    // Prepare the write transaction
    const txData = await whatsabiClient.prepareWriteContract(
      contractAddress as Address,
      {
        functionName,
        args,
        signature,
        sighash,
      }
    );

    return NextResponse.json({
      txData,
      message: "Transaction prepared successfully",
    });
  } catch (error: any) {
    console.error("Error preparing write transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to prepare write transaction" },
      { status: 500 }
    );
  }
}
