
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Debugging Profit/Loss Queries...");

    // Simulate "This Month" (Feb 2026)
    const startDate = "2026-02-01T00:00:00.000Z";
    const endDate = "2026-02-28T23:59:59.999Z";

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log(`Date Range: ${start.toISOString()} - ${end.toISOString()}`);

    try {
        console.log("1. Fetching Sales Stats...");
        const salesStats: any[] = await prisma.$queryRaw`
            SELECT 
                COALESCE(SUM(t."priceSnapshot" * t.quantity), 0) as revenue,
                COALESCE(SUM(t."costSnapshot" * t.quantity), 0) as cost,
                COUNT(t.id)::int as "transactionCount",
                COALESCE(SUM(t.quantity), 0)::int as "itemsSold"
            FROM "Transaction" t
            WHERE t.type = 'OUT'
            AND t."createdAt" >= ${start}
            AND t."createdAt" <= ${end}
        `;
        console.log("Sales Stats:", salesStats);

        console.log("2. Fetching Timeline...");
        const timelineRaw: any[] = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(t."createdAt", 'YYYY-MM-DD') as date,
                COALESCE(SUM(t."priceSnapshot" * t.quantity), 0) as revenue,
                COALESCE(SUM(t."costSnapshot" * t.quantity), 0) as cost
            FROM "Transaction" t
            WHERE t.type = 'OUT'
            AND t."createdAt" >= ${start}
            AND t."createdAt" <= ${end}
            GROUP BY TO_CHAR(t."createdAt", 'YYYY-MM-DD')
            ORDER BY date ASC
        `;
        console.log("Timeline Raw:", timelineRaw);

        console.log("✅ Queries executed successfully.");

        console.log("3. Fetching Low Stock Count (Dashboard)...");
        const lowStockCountResult: any = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count FROM "Product" WHERE quantity <= "minStock" AND quantity > 0
        `;
        console.log("Low Stock Count:", lowStockCountResult);

        console.log("4. Fetching Low Stock IDs (Dashboard)...");
        const lowStockIdsResult: any = await prisma.$queryRaw`
            SELECT id FROM "Product" WHERE quantity <= "minStock" ORDER BY quantity ASC LIMIT 5
        `;
        console.log("Low Stock IDs:", lowStockIdsResult);

        console.log("5. Fetching Financial Stats (Dashboard)...");
        const financialStats: any = await prisma.$queryRaw`
            SELECT 
                COALESCE(SUM("priceSnapshot" * quantity), 0) as revenue,
                COALESCE(SUM("costSnapshot" * quantity), 0) as cost
            FROM "Transaction"
            WHERE type = 'OUT'
        `;
        console.log("Financial Stats:", financialStats);

        console.log("6. Testing Prisma Client Expense Model...");
        if ((prisma as any).expense) {
            console.log("✅ prisma.expense exists.");
        } else {
            console.error("❌ prisma.expense is UNDEFINED. You may need to run `npx prisma generate`.");
        }

        console.log("7. Testing getSalesData logic...");
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const transactions = await prisma.transaction.findMany({
            where: {
                type: "OUT",
                createdAt: { gte: sevenDaysAgo }
            }
        });
        console.log(`Transactions last 7 days: ${transactions.length}`);

    } catch (error) {
        console.error("❌ Query Failed:", error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
