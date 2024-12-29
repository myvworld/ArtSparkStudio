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
    await db.execute(sql`SELECT 1`);
    console.log("Database connection initialized and tested successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

// Execute the test immediately
testConnection();

export { db };