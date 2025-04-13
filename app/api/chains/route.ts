import { NextResponse } from "next/server";
import { getDb, isConnected } from "@/app/lib/mongodb";
import { ChainConfig } from "@/app/lib/chainConfig";
import { z } from "zod";

const chainSchema = z.object({
  id: z.number(),
  name: z.string(),
  rpcUrl: z.string().url(),
  blockExplorerUrl: z.string().url().optional(),
  isTestnet: z.boolean(),
});

export async function GET() {
  try {
    console.log("GET /api/chains: Checking MongoDB connection...");
    if (!(await isConnected())) {
      console.error("GET /api/chains: Database connection failed");
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    console.log("GET /api/chains: Getting database...");
    const db = await getDb();
    console.log("GET /api/chains: Fetching chains from collection...");
    const chains = await db.collection("customChains").find({}).toArray();
    console.log(`GET /api/chains: Found ${chains.length} chains`);

    return NextResponse.json(chains);
  } catch (error) {
    console.error("GET /api/chains error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chains" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/chains: Checking MongoDB connection...");
    if (!(await isConnected())) {
      console.error("POST /api/chains: Database connection failed");
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const body = await request.json();
    console.log("POST /api/chains: Received data:", body);

    // Validate the request body
    const validatedChain = chainSchema.safeParse(body);
    if (!validatedChain.success) {
      console.error(
        "POST /api/chains: Validation failed",
        validatedChain.error
      );
      return NextResponse.json(
        { error: "Invalid chain data", details: validatedChain.error },
        { status: 400 }
      );
    }

    const chain = validatedChain.data;
    console.log("POST /api/chains: Getting database...");
    const db = await getDb();
    console.log("POST /api/chains: Saving chain to collection...");

    const result = await db
      .collection("customChains")
      .updateOne({ id: chain.id }, { $set: chain }, { upsert: true });

    console.log("POST /api/chains: Save result:", result);

    // Verify the operation
    const savedChain = await db
      .collection("customChains")
      .findOne({ id: chain.id });
    if (!savedChain) {
      throw new Error("Chain was not saved successfully");
    }

    console.log("POST /api/chains: Chain saved successfully:", savedChain);
    return NextResponse.json(savedChain);
  } catch (error) {
    console.error("POST /api/chains error:", error);
    return NextResponse.json(
      { error: "Failed to save chain" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("DELETE /api/chains: Checking MongoDB connection...");
    if (!(await isConnected())) {
      console.error("DELETE /api/chains: Database connection failed");
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const chainId = body.chainId;

    if (!chainId) {
      console.error("DELETE /api/chains: No chain ID provided");
      return NextResponse.json(
        { error: "Chain ID is required" },
        { status: 400 }
      );
    }

    console.log(`DELETE /api/chains: Deleting chain with ID ${chainId}`);
    const db = await getDb();
    const result = await db.collection("customChains").deleteOne({
      id: parseInt(chainId),
    });

    console.log("DELETE /api/chains: Delete result:", result);
    if (result.deletedCount === 0) {
      console.error(`DELETE /api/chains: Chain with ID ${chainId} not found`);
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    console.log(
      `DELETE /api/chains: Chain with ID ${chainId} deleted successfully`
    );
    return NextResponse.json({
      message: "Chain deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/chains error:", error);
    return NextResponse.json(
      { error: "Failed to delete chain" },
      { status: 500 }
    );
  }
}
