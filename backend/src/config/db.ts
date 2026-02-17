import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is undefined in environment variables!");
} else {
    // Mask password in connection string for safe logging
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":*****@");
    console.log("✅ DATABASE_URL is defined: " + maskedUrl);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
