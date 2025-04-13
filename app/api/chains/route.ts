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
    if (!(await isConnected())) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const db = await getDb();
    const chains = await db.collection("customChains").find({}).toArray();

    return NextResponse.json({ chains });
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
    if (!(await isConnected())) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedChain = chainSchema.safeParse(body);
    if (!validatedChain.success) {
      return NextResponse.json(
        { error: "Invalid chain data", details: validatedChain.error },
        { status: 400 }
      );
    }

    const chain = validatedChain.data;
    const db = await getDb();

    const result = await db
      .collection("customChains")
      .updateOne({ id: chain.id }, { $set: chain }, { upsert: true });

    // Verify the operation
    const savedChain = await db
      .collection("customChains")
      .findOne({ id: chain.id });
    if (!savedChain) {
      throw new Error("Chain was not saved successfully");
    }

    return NextResponse.json({
      message: "Chain saved successfully",
      chain: savedChain,
      operation: result.upsertedCount > 0 ? "inserted" : "updated",
    });
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
    if (!(await isConnected())) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get("chainId");

    if (!chainId) {
      return NextResponse.json(
        { error: "Chain ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("customChains").deleteOne({
      id: parseInt(chainId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

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
