import { Request, Response } from "express";
import prisma from "../config/db";
import bcrypt from "bcryptjs";
import { logAction } from "../services/auditService";

export const clearAllData = async (req: Request, res: Response) => {
    try {
        const { password } = req.body;
        const userId = (req as any).user?.userId;

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        // Verify Admin Password
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Execute Deletion Transaction
        // Delete dependent data first
        await prisma.$transaction([
            prisma.transaction.deleteMany({}),
            prisma.product.deleteMany({}),
            prisma.category.deleteMany({}),
            prisma.auditLog.deleteMany({}), // Clear logs too as requested "Delete All Data"
        ]);

        // Log this action (but we just deleted logs? So this will be the first new log)
        await logAction(userId, "DELETE", "SYSTEM", "ALL", { message: "All data cleared by admin" });

        res.json({ message: "All data cleared successfully" });
    } catch (error) {
        console.error("Clear data error:", error);
        res.status(500).json({ message: "Error clearing data", error });
    }
};
