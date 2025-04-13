import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const uri = process.env.NEXT_PUBLIC_MONGODB_URI;
console.log("Connecting to MongoDB...");

// Simplify connection options
const options: MongoClientOptions = {
  // Remove timeouts and pool settings that might cause issues
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB:", err);
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  });
}

// Export a module-scoped MongoClient promise
export default clientPromise;

export const getDb = async () => {
  try {
    const client = await clientPromise;
    // Don't specify database name - use the one from the connection string
    const db = client.db();
    // Test the connection
    await db.command({ ping: 1 });
    console.log("Successfully connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export const isConnected = async () => {
  try {
    const client = await clientPromise;
    // Just ping the server without specifying database
    await client.db().command({ ping: 1 });
    console.log("MongoDB connection is alive");
    return true;
  } catch (err) {
    console.error("MongoDB connection check failed:", err);
    return false;
  }
};
