
import * as fs from 'fs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const logFile = 'auth-verify.log';

function log(message: any) {
    const msg = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\n');
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        fs.writeFileSync(logFile, '');
    } catch (err) { }

    log("Starting Auth Verification...");
    try {
        await prisma.$connect();

        const userCount = await prisma.user.count();
        log("Total Users: " + userCount);

        log("Checking RefreshToken Table...");
        try {
            const columns: any = await prisma.$queryRaw`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'RefreshToken'
            `;
            log("DEBUG: Columns in RefreshToken table: " + JSON.stringify(columns));

            const tokenCount = await prisma.refreshToken.count();
            log("Total RefreshTokens: " + tokenCount);

        } catch (ex: any) {
            log("Could not inspect RefreshToken schema: " + ex.message);
        }

        // Simulate Logout Logic (Delete non-existent token)
        log("Testing Delete operation...");
        try {
            const result = await prisma.refreshToken.deleteMany({ where: { token: "dummy_token" } });
            log("Delete dummy token result: " + JSON.stringify(result));
        } catch (ex: any) {
            log("Delete failed: " + ex.message);
        }

        log("✅ Auth Verification Successful!");

    } catch (error: any) {
        log("❌ Auth Verification Failed: " + error.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
