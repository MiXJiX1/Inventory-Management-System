
import axios from 'axios';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const API_URL = "http://localhost:4000";

async function main() {
    console.log("Starting Category Verification...");
    try {
        await prisma.$connect();

        const categoryCount = await prisma.category.count();
        console.log("Total Categories in DB:", categoryCount);

        const categories = await prisma.category.findMany();
        console.log("Categories:", JSON.stringify(categories, null, 2));

        console.log("Testing API GET /categories...");
        try {
            const res = await axios.get(`${API_URL}/categories`);
            console.log("API Status:", res.status);
            console.log("API Data:", JSON.stringify(res.data, null, 2));
        } catch (e: any) {
            console.error("API Call Failed:", e.message);
            if (e.response) console.error("Response:", e.response.data);
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
