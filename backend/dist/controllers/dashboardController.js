"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await db_1.default.product.count();
        const totalStockResult = await db_1.default.product.aggregate({
            _sum: { quantity: true },
        });
        const totalStock = totalStockResult._sum.quantity || 0;
        // Use raw query or filter because 'status' is computed in application layer, 
        // but here we can query based on logic: quantity <= minStock, quantity == 0
        // Prisma doesn't support computed columns in where clause directly if not in DB.
        const lowStockCount = await db_1.default.product.count({
            where: {
                quantity: {
                    lte: db_1.default.product.fields.minStock
                },
                NOT: {
                    quantity: 0
                }
            }
        });
        const outOfStockCount = await db_1.default.product.count({
            where: { quantity: 0 },
        });
        const recentProducts = await db_1.default.product.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
        });
        const lowStockProducts = await db_1.default.product.findMany({
            where: {
                quantity: {
                    lte: db_1.default.product.fields.minStock
                }
            },
            take: 5,
            orderBy: { quantity: 'asc' }
        });
        res.json({
            totalProducts,
            totalStock,
            lowStockCount,
            outOfStockCount,
            recentProducts,
            lowStockProducts
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching dashboard stats", error });
    }
};
exports.getDashboardStats = getDashboardStats;
