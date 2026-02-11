-- 0. Create ENUM Type (TransactionType) if not exists
DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Create Transaction Table (If not exists - for safety)
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- 2. Create Products (Sample Data)
INSERT INTO "Product" ("id", "name", "sku", "category", "price", "quantity", "minStock", "updatedAt")
VALUES 
    ('p1', 'Gaming Laptop', 'LAP-001', 'Electronics', 1200, 45, 10, NOW()),
    ('p2', 'Wireless Mouse', 'ACC-002', 'Accessories', 25, 100, 20, NOW()),
    ('p3', 'Mechanical Keyboard', 'ACC-003', 'Accessories', 80, 30, 15, NOW()),
    ('p4', '4K Monitor', 'MON-004', 'Electronics', 400, 15, 5, NOW()),
    ('p5', 'Ergonomic Chair', 'FUR-005', 'Furniture', 250, 8, 5, NOW())
ON CONFLICT ("sku") DO UPDATE 
SET "quantity" = EXCLUDED."quantity";

-- 3. Create Transactions (Backdated 15 days)
-- We will generate random sales (OUT) for these products over the last 15 days
INSERT INTO "Transaction" ("id", "type", "quantity", "productId", "createdAt")
VALUES
    -- Day 1 (Today)
    (gen_random_uuid()::text, 'OUT', 2, 'p1', NOW()),
    (gen_random_uuid()::text, 'OUT', 5, 'p2', NOW()),
    
    -- Day 2 (Yesterday)
    (gen_random_uuid()::text, 'OUT', 1, 'p1', NOW() - INTERVAL '1 day'),
    (gen_random_uuid()::text, 'OUT', 3, 'p3', NOW() - INTERVAL '1 day'),
    (gen_random_uuid()::text, 'OUT', 10, 'p2', NOW() - INTERVAL '1 day'),

    -- Day 3
    (gen_random_uuid()::text, 'OUT', 4, 'p3', NOW() - INTERVAL '2 days'),
    (gen_random_uuid()::text, 'OUT', 1, 'p4', NOW() - INTERVAL '2 days'),

    -- Day 4
    (gen_random_uuid()::text, 'OUT', 2, 'p5', NOW() - INTERVAL '3 days'),
    (gen_random_uuid()::text, 'OUT', 6, 'p2', NOW() - INTERVAL '3 days'),

    -- Day 5
    (gen_random_uuid()::text, 'OUT', 3, 'p1', NOW() - INTERVAL '4 days'),
    (gen_random_uuid()::text, 'OUT', 2, 'p4', NOW() - INTERVAL '4 days'),

    -- Day 6
    (gen_random_uuid()::text, 'OUT', 8, 'p2', NOW() - INTERVAL '5 days'),
    (gen_random_uuid()::text, 'OUT', 1, 'p5', NOW() - INTERVAL '5 days'),

    -- Day 7
    (gen_random_uuid()::text, 'OUT', 5, 'p3', NOW() - INTERVAL '6 days'),

    -- Day 8
    (gen_random_uuid()::text, 'OUT', 2, 'p1', NOW() - INTERVAL '7 days'),

    -- Day 9
    (gen_random_uuid()::text, 'OUT', 12, 'p2', NOW() - INTERVAL '8 days'),

    -- Day 10
    (gen_random_uuid()::text, 'OUT', 1, 'p4', NOW() - INTERVAL '9 days'),

    -- Day 11
    (gen_random_uuid()::text, 'OUT', 3, 'p5', NOW() - INTERVAL '10 days'),

    -- Day 12
    (gen_random_uuid()::text, 'OUT', 4, 'p3', NOW() - INTERVAL '11 days'),

    -- Day 13
    (gen_random_uuid()::text, 'OUT', 7, 'p2', NOW() - INTERVAL '12 days'),

    -- Day 14
    (gen_random_uuid()::text, 'OUT', 2, 'p1', NOW() - INTERVAL '13 days'),

    -- Day 15
    (gen_random_uuid()::text, 'OUT', 1, 'p4', NOW() - INTERVAL '14 days');

-- Optional: Add some Restock (IN) transactions to make it realistic
INSERT INTO "Transaction" ("id", "type", "quantity", "productId", "createdAt")
VALUES
    (gen_random_uuid()::text, 'IN', 50, 'p2', NOW() - INTERVAL '10 days'),
    (gen_random_uuid()::text, 'IN', 20, 'p1', NOW() - INTERVAL '15 days');
