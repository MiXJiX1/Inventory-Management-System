
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

async function main() {
    console.log("Seeding Categories...");
    try {
        await prisma.$connect();

        const categories = ["Electronics", "Clothing", "Home & Garden", "Books", "Toys"];

        for (const name of categories) {
            const exists = await prisma.category.findUnique({ where: { name } });
            if (!exists) {
                await prisma.category.create({ data: { name } });
                console.log(`Created category: ${name}`);
            } else {
                console.log(`Category exists: ${name}`);
            }
        }
        console.log("✅ Seeding completed!");

    } catch (err) {
        console.error("Error Seeding:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
