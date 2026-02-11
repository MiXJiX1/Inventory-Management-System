
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Important for Supabase/Neon
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Listing Users...");
    await prisma.$connect();
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));

    // Check if any admin exists
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    console.log(`\nTotal Users: ${users.length}`);
    console.log(`Total Admins: ${adminCount}`);

    if (adminCount === 0 && users.length > 0) {
        console.log("\n⚠️ No ADMIN found! Promoting the first user to ADMIN...");
        const firstUser = users[0];
        await prisma.user.update({
            where: { id: firstUser.id },
            data: { role: 'ADMIN' }
        });
        console.log(`✅ Promoted user ${firstUser.email} to ADMIN.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
