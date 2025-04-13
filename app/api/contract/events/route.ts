import { NextResponse } from "next/server";
import { getWhatsABIClient } from "@/app/lib/whatsabiClient";
import { Address } from "viem";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const contractAddress = url.searchParams.get("address");
    const chainId = parseInt(url.searchParams.get("chainId") || "1", 10);

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

    // Get WhatsABI client with specified chain ID - now async
    const whatsabiClient = await getWhatsABIClient(chainId as any);

    // Get contract events
    const events = await whatsabiClient.getContractEvents(
      contractAddress as Address
    );

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Error getting contract events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get contract events" },
      { status: 500 }
    );
  }
}
