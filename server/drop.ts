import * as dotenv from 'dotenv';
dotenv.config();
import { db } from "./db";
import { sql } from "drizzle-orm";

async function dropSchema() {
  try {
    console.log("Dropping public schema...");
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    console.log("Schema public dropped and recreated successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to drop schema", error);
    process.exit(1);
  }
}

dropSchema();
