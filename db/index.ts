import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});

// Test the database connection using a function instead of top-level await
async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Verify database URL
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not configured");
    }

    // Test basic connectivity with proper error handling
    const result = await db.execute(sql`SELECT current_timestamp`);
    if (!result) {
      throw new Error("Failed to execute test query");
    }

    console.log("Database connection verified successfully:", {
      url: process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'),
      status: 'connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Database connection error:", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
      connectionUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')
    });
    throw error;
  }
}

// Execute the test
testConnection()
  .catch((error) => {
    console.error("Failed to establish database connection:", error);
    process.exit(1);
  });

export { db };