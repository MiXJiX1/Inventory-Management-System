import { Request, Response } from "express";
import prisma from "../config/db";

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        console.log("DEBUG: getDashboardStats called");
        const totalProducts = await prisma.product.count();
        console.log("DEBUG: totalProducts", totalProducts);

        const totalStockResult = await prisma.product.aggregate({
            _sum: { quantity: true },
        });
        const totalStock = totalStockResult._sum.quantity || 0;
        console.log("DEBUG: totalStock", totalStock);

        // Count Low Stock (quantity <= minStock AND quantity > 0)
        console.log("DEBUG: calculating lowStockCount");
        const lowStockCountResult: any = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count FROM "Product" WHERE quantity <= "minStock" AND quantity > 0
        `;
        const lowStockCount = lowStockCountResult[0]?.count || 0;
        console.log("DEBUG: lowStockCount", lowStockCount);

        const outOfStockCount = await prisma.product.count({
            where: { quantity: 0 },
        });

        const recentProducts = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { Category: true }
        });

        // Get Low Stock Products (limit 5)
        console.log("DEBUG: fetching lowStockIds");
        const lowStockIdsResult: any = await prisma.$queryRaw`
            SELECT id FROM "Product" WHERE quantity <= "minStock" ORDER BY quantity ASC LIMIT 5
        `;
        const lowStockIds = lowStockIdsResult.map((p: any) => p.id);

        const lowStockProducts = await prisma.product.findMany({
            where: {
                id: { in: lowStockIds }
            },
            include: { Category: true },
            orderBy: { quantity: 'asc' }
        });

        // Financial Stats
        console.log("DEBUG: fetching financialStats");
        const financialStats: any = await prisma.$queryRaw`
            SELECT 
                COALESCE(SUM("priceSnapshot" * quantity), 0) as revenue,
                COALESCE(SUM("costSnapshot" * quantity), 0) as cost
            FROM "Transaction"
            WHERE type = 'OUT'
        `;

        const totalRevenue = financialStats[0]?.revenue || 0;
        const totalCost = financialStats[0]?.cost || 0;
        const netProfit = totalRevenue - totalCost;
        console.log("DEBUG: financialStats done", { totalRevenue, totalCost });

        console.log("DEBUG: fetching salesData");
        const salesData = await getSalesData();
        console.log("DEBUG: salesData done");

        res.json({
            totalProducts,
            totalStock,
            lowStockCount,
            outOfStockCount,
            totalRevenue,
            totalCost,
            netProfit,
            recentProducts,
            lowStockProducts,
            salesData
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: "Error fetching dashboard stats", error });
    }
};


export const getProfitLossStats = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, categoryId } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(0);
        const end = endDate ? new Date(endDate as string) : new Date();

        // 1. Revenue & Cost (COGS) & Transaction Counts
        let salesStats: any[];

        // Base query part
        // We need: revenue, cost, transactionCount (count of rows), quantitySold (sum of quantity)
        // Note: transactionCount in this system = number of line items sold. 
        // We will label it "Items Sold" or "Transactions". 
        // If user wants "Bills", we will approximate it or just use transaction count for now.
        // Actually, let's get:
        // - sum(price * qty) -> Revenue
        // - sum(cost * qty) -> COGS
        // - count(id) -> Transaction Count
        // - sum(qty) -> Total Items Sold

        if (categoryId && categoryId !== 'ALL') {
            salesStats = await prisma.$queryRaw`
                SELECT 
                    COALESCE(SUM(t."priceSnapshot" * t.quantity), 0) as revenue,
                    COALESCE(SUM(t."costSnapshot" * t.quantity), 0) as cost,
                    COUNT(t.id)::int as "transactionCount",
                    COALESCE(SUM(t.quantity), 0)::int as "itemsSold"
                FROM "Transaction" t
                JOIN "Product" p ON t."productId" = p.id
                WHERE t.type = 'OUT'
                AND t."createdAt" >= ${start}
                AND t."createdAt" <= ${end}
                AND p."categoryId" = ${categoryId}
            `;
        } else {
            salesStats = await prisma.$queryRaw`
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
        }

        const totalRevenue = salesStats[0]?.revenue || 0;
        const totalCost = salesStats[0]?.cost || 0; // This is COGS
        const transactionCount = salesStats[0]?.transactionCount || 0;
        const totalItemsSold = salesStats[0]?.itemsSold || 0;

        // Calculate Average Sale per Bill (here "Bill" = Transaction line item for now, or we can say per Item?)
        // User asked "ยอดขายเฉลี่ยต่อบิล" (Avg sale per bill). 
        // Since we don't have bills, we'll use Transaction Count as proxy for Bills.
        const averageSalePerBill = transactionCount > 0 ? totalRevenue / transactionCount : 0;


        // 2. Expenses (Other Expenses)
        // Filter expenses by date. Category filter might NOT apply to expenses usually, unless expenses are tagged by category?
        // Usually expenses are general (Rent, Utility). 
        // If categoryId is selected, should we filter expenses? 
        // Probably NOT, unless we allow allocating expenses to categories.
        // For now, let's include ALL expenses in that date range, OR maybe hide expenses if a specific category is selected?
        // It's safer to show 0 or partial? 
        // Let's assume expenses are global. If category is selected, maybe we shouldn't subtract global expenses from specific category profit?
        // Standard practice: Contribution Margin vs Net Profit.
        // Let's just return total expenses for the period, and maybe warn if category is selected. 
        // Or just substract them.

        let totalExpenses = 0;
        let expenseList: any[] = [];

        // Only fetch expenses if we are looking at ALL categories? 
        // Or just fetch them anyway. Let's fetch them anyway but maybe the frontend decides how to show.
        // But Net Profit calculation depends on it.
        // Let's fetch expenses for the date range.

        expenseList = await prisma.expense.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: { date: 'desc' }
        });

        totalExpenses = expenseList.reduce((sum, exp) => sum + exp.amount, 0);

        // 3. Profit
        const grossProfit = totalRevenue - totalCost;

        // If filtering by category, allocating global expenses is tricky.
        // Let's subtract full expenses for now, or maybe returning them separately.
        const netProfit = grossProfit - totalExpenses;


        // 4. Charts Data

        // A. Timeline (Revenue, Cost, Profit)
        // Group by Date (Day)
        // We use ::date to cast timestamp to date in Postgres

        let timelineRaw: any[];

        if (categoryId && categoryId !== 'ALL') {
            timelineRaw = await prisma.$queryRaw`
                SELECT 
                    TO_CHAR(t."createdAt", 'YYYY-MM-DD') as date,
                    COALESCE(SUM(t."priceSnapshot" * t.quantity), 0) as revenue,
                    COALESCE(SUM(t."costSnapshot" * t.quantity), 0) as cost
                FROM "Transaction" t
                JOIN "Product" p ON t."productId" = p.id
                WHERE t.type = 'OUT'
                AND t."createdAt" >= ${start}
                AND t."createdAt" <= ${end}
                AND p."categoryId" = ${categoryId}
                GROUP BY TO_CHAR(t."createdAt", 'YYYY-MM-DD')
                ORDER BY date ASC
            `;
        } else {
            timelineRaw = await prisma.$queryRaw`
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
        }

        // Expenses Timeline
        // We need to group expenses by date as well to subtract from profit
        const expensesTimelineRaw: any[] = await prisma.$queryRaw`
            SELECT 
                TO_CHAR("date", 'YYYY-MM-DD') as date,
                COALESCE(SUM(amount), 0) as amount
            FROM "Expense"
            WHERE "date" >= ${start}
            AND "date" <= ${end}
            GROUP BY TO_CHAR("date", 'YYYY-MM-DD')
        `;

        // Merge Timelines
        const timelineMap = new Map<string, any>();

        // Fill with revenue/cost
        timelineRaw.forEach((item: any) => {
            timelineMap.set(item.date, {
                date: item.date,
                revenue: item.revenue || 0,
                cost: item.cost || 0,
                expense: 0,
                profit: (item.revenue || 0) - (item.cost || 0)
            });
        });

        // Fill with expenses
        expensesTimelineRaw.forEach((item: any) => {
            const existing = timelineMap.get(item.date) || {
                date: item.date,
                revenue: 0,
                cost: 0,
                expense: 0,
                profit: 0
            };
            existing.expense = item.amount || 0;
            existing.profit -= existing.expense; // Net Profit = Gross - Expense
            timelineMap.set(item.date, existing);
        });

        const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // B. Revenue by Category (Pie Chart)
        const categoryBreakdown: any[] = await prisma.$queryRaw`
            SELECT 
                c.name as name,
                COALESCE(SUM(t."priceSnapshot" * t.quantity), 0) as value
            FROM "Transaction" t
            JOIN "Product" p ON t."productId" = p.id
            JOIN "Category" c ON p."categoryId" = c.id
            WHERE t.type = 'OUT'
            AND t."createdAt" >= ${start}
            AND t."createdAt" <= ${end}
            GROUP BY c.name
        `;

        // C. Expense by Type (Pie Chart)
        const expenseBreakdownRaw: any[] = await prisma.$queryRaw`
            SELECT 
                type, 
                COALESCE(SUM(amount), 0) as amount
            FROM "Expense"
            WHERE date >= ${start}
            AND date <= ${end}
            GROUP BY type
        `;

        const expenseBreakdown = expenseBreakdownRaw.map((e: any) => ({
            name: e.type || "Uncategorized",
            value: e.amount || 0
        }));


        // D. Advanced KPIs

        // 1. Margins
        const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // 2. Top 5 Best Selling Products (Quantity)
        let topSellingRaw: any[];
        if (categoryId && categoryId !== 'ALL') {
            topSellingRaw = await prisma.$queryRaw`
                SELECT 
                    p.name,
                    COALESCE(SUM(t.quantity), 0)::int as value
                FROM "Transaction" t
                JOIN "Product" p ON t."productId" = p.id
                WHERE t.type = 'OUT'
                AND t."createdAt" >= ${start}
                AND t."createdAt" <= ${end}
                AND p."categoryId" = ${categoryId}
                GROUP BY p.name
                ORDER BY value DESC
                LIMIT 5
            `;
        } else {
            topSellingRaw = await prisma.$queryRaw`
                SELECT 
                    p.name,
                    COALESCE(SUM(t.quantity), 0)::int as value
                FROM "Transaction" t
                JOIN "Product" p ON t."productId" = p.id
                WHERE t.type = 'OUT'
                AND t."createdAt" >= ${start}
                AND t."createdAt" <= ${end}
                GROUP BY p.name
                ORDER BY value DESC
                LIMIT 5
            `;
        }

        // 3. Top 5 Most Profitable Products (Profit)
        let mostProfitableRaw: any[];
        if (categoryId && categoryId !== 'ALL') {
            mostProfitableRaw = await prisma.$queryRaw`
                SELECT 
                    p.name,
                    COALESCE(SUM((t."priceSnapshot" - t."costSnapshot") * t.quantity), 0) as value
                FROM "Transaction" t
                JOIN "Product" p ON t."productId" = p.id
                WHERE t.type = 'OUT'
                AND t."createdAt" >= ${start}
                AND t."createdAt" <= ${end}
                AND p."categoryId" = ${categoryId}
                GROUP BY p.name
                ORDER BY value DESC
                LIMIT 5
            `;
        } else {
            mostProfitableRaw = await prisma.$queryRaw`
                SELECT 
                    p.name,
                    COALESCE(SUM((t."priceSnapshot" - t."costSnapshot") * t.quantity), 0) as value
                FROM "Transaction" t
                JOIN "Product" p ON t."productId" = p.id
                WHERE t.type = 'OUT'
                AND t."createdAt" >= ${start}
                AND t."createdAt" <= ${end}
                GROUP BY p.name
                ORDER BY value DESC
                LIMIT 5
            `;
        }

        res.json({
            stats: {
                totalRevenue,
                totalCost, // COGS
                grossProfit,
                totalExpenses,
                netProfit,
                transactionCount,
                totalItemsSold,
                averageSalePerBill
            },
            breakdown: {
                expenses: expenseList
            },
            charts: {
                timeline,
                byCategory: categoryBreakdown,
                byExpense: expenseBreakdown
            },
            kpi: {
                grossProfitMargin,
                netProfitMargin,
                topSelling: topSellingRaw,
                mostProfitable: mostProfitableRaw
            }
        });

    } catch (error) {
        console.error("Profit/Loss Filter Error:", error);
        res.status(500).json({ message: "Error fetching profit/loss stats", error });
    }
};

async function getSalesData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const transactions = await prisma.transaction.findMany({
        where: {
            type: "OUT",
            createdAt: {
                gte: sevenDaysAgo
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    // Group by Date
    const salesMap = new Map<string, number>();

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        salesMap.set(dateStr, 0);
    }

    transactions.forEach(t => {
        const dateStr = t.createdAt.toISOString().split('T')[0];
        if (salesMap.has(dateStr)) {
            salesMap.set(dateStr, (salesMap.get(dateStr) || 0) + t.quantity);
        }
    });

    return Array.from(salesMap.entries()).map(([date, total]) => ({
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
        total
    }));
}
