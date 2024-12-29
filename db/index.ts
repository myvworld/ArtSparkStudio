import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("Initializing database connection...");

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

    // Test basic connectivity
    await db.execute(sql`SELECT 1`);
    
    // Verify we can query a table
    await db.execute(sql`SELECT COUNT(*) FROM users`);
    
    // Test write permission with a temporary record
    await db.transaction(async (tx) => {
      const [result] = await tx.execute(sql`
        CREATE TEMPORARY TABLE _connection_test (id SERIAL PRIMARY KEY);
        DROP TABLE _connection_test;
      `);
      return result;
    });

    console.log("Database connection verified successfully:", {
      url: process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'),
      status: 'connected'
    });
  } catch (error) {
    console.error("Database connection error:", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
      connectionUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')
    });
    process.exit(1);
  }
}

// Execute the test immediately
testConnection();

export { db };