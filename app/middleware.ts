import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware ensures our API routes have access to environment variables
export function middleware(request: NextRequest) {
  // Check if required environment variables are set
  const missingVars = [];

  if (!process.env.ETHERSCAN_API_KEY) {
    missingVars.push("ETHERSCAN_API_KEY");
  }

  if (!process.env.BLOCKSCOUT_API_KEY) {
    missingVars.push("BLOCKSCOUT_API_KEY");
  }

  // Only apply this middleware to API routes
  if (
    request.nextUrl.pathname.startsWith("/api/contract") &&
    missingVars.length > 0
  ) {
    return NextResponse.json(
      {
        error: `Missing required environment variables: ${missingVars.join(
          ", "
        )}`,
        message:
          "Please set these variables in your .env.local file or environment configuration.",
      },
      { status: 500 }
    );
  }

  return NextResponse.next();
}

// Only run this middleware on API routes
export const config = {
  matcher: "/api/contract/:path*",
};
