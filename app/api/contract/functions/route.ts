import { NextResponse } from "next/server";
import { getWhatsABIClientById } from "@/app/lib/whatsabiClient";
import { z } from "zod";
import { isAddress, getAddress } from "viem";

// Schema for request parameters
const RequestSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr), { message: "Invalid contract address" }),
  chainId: z.number().int().positive(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawAddress = searchParams.get("address")?.toLowerCase();
    const chainId = parseInt(searchParams.get("chainId") || "1");

    if (!rawAddress) {
      throw new Error("Address parameter is required");
    }

    // Ensure address is properly checksummed
    const address = getAddress(rawAddress);
    console.log("Normalized address:", address);

    // Validate parameters
    const validatedParams = RequestSchema.parse({ address, chainId });

    // Get WhatsABI client for the specified chain
    const client = await getWhatsABIClientById(validatedParams.chainId);
    console.log("WhatsABI client initialized");

    // Get contract functions
    const functions = await client.getContractFunctions(
      validatedParams.address
    );
    console.log(
      `Found ${functions.length} functions for contract ${validatedParams.address}`
    );

    return NextResponse.json({ functions });
  } catch (error) {
    console.error("Error in contract functions route:", error);

    // Enhanced error response
    const errorResponse = {
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
      details:
        error instanceof Error && "details" in error
          ? (error as any).details
          : undefined,
    };

    return NextResponse.json(errorResponse, { status: 400 });
  }
}
